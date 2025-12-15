import { RequestHandler } from "express";
import { paystackConfig } from "../../../config";
import Payments from "../../models/payment.models";
import Cart from "../../models/cart.model";
import Orders from "../../models/order.model";
import VendorOrders from "../../models/vendorOrder.model";
import Products from "../../models/products.model";

export const VerifyTransaction: RequestHandler = async (req, res) => {
  const reference = req.params.reference;
  if (!reference)
    return res.status(400).json({
      success: true,
      message: "reference param required",
    });

  try {
    const reqt = await fetch(
      `${paystackConfig.verify_url}/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackConfig.secret_key}`,
          // 'Content-Type': 'application/json'
        },
        credentials: "include",
      }
    );
    const resp = await reqt.json();
    console.log(resp);

    let userId = resp.data.metadata?.user_id;

    // Check for duplicate payment reference FIRST
    // We expect the payment to exist from init.
    const existingPayment = await Payments.findOne({ reference });

    // Fallback: If userId missing from Paystack metadata, try to get it from local DB
    if (!userId && existingPayment) {
        console.log("UserID missing from Paystack metadata. propergating from local DB...");
        userId = existingPayment.userId;
    }
    
    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "Payment metadata missing: user_id not provided (and not found in local DB)",
      });
    }
    
    if (!existingPayment) {
        // If it doesn't exist, we can create it OR fail. 
        // Failing is safer if we strictly expect init to be called.
        // But for robustness, let's allow creation but use a safe ID or let mongoose gen it.
        // ACTUALLY, if we upsert, we might get duplicate key error if we don't assume init's _id strategy.
        // Let's just create if not found, but WITHOUT specific _id (let mongoose gen ObjectId).
        // But better: Just fail if not found? No, Paystack might call verify before init? No. init calls paystack.
        
        // Let's assume init passed. If not found, it's weird.
        // But user said "Verification Failed".
        // Maybe reference mismatch?
        console.warn(`Payment record not found for ref: ${reference}. Creating new record.`);
    } else if (existingPayment.status === "success") {
       return res.status(400).json({
          status: false,
          message: "Payment already verified",
       });
    }

    // update the db here
    await Payments.findOneAndUpdate(
      { reference },
      {
        status: resp.data.status,
        paid_at: resp.data.paid_at || new Date(),
        raw: resp.data,
      },
      { new: true, upsert: true } // Keep upsert for safety, but verify ID generation won't collide.
    );
    
    // Only proceed to create order if payment was successful
    if (resp.data.status !== "success") {
         return res.status(400).json({
            status: false,
            message: `Payment status: ${resp.data.status}`,
         });
    }
    
    // Check if order already exists for this reference (Double safety)
    const existingOrder = await Orders.findOne({ payment_reference: reference });
    if (existingOrder) {
        return res.status(200).json({
            status: true,
            message: "Order already exists",
            data: resp.data
        });
    }

    const cartItems = await Cart.find({ user_id: userId }) // userId from metadata
      .populate("store")
      .populate("product_id")
      .lean();
      
    if (!cartItems || cartItems.length === 0) {
        // If cart is empty, maybe it was already cleared?
        // Or maybe we should log this.
        console.warn("No cart items found for user", userId);
    }

    const deliveryMethod = resp.data.metadata?.deliveryMethod || "school_post";

    const orderItems = cartItems.map((item) => ({
      product_id: item.product_id,
      vendor_id: item.store?.owner, 
      store_id: item.store?._id,
      quantity: item.quantity,
      price: item.price,
      name: item.name,
      img: item.img,
    }));

    const order = await Orders.create({
      user_id: userId,
      items: orderItems,
      payment_reference: reference,
      total: resp.data.amount / 100,
      status: "paid",
      delivery_method: deliveryMethod // Ensure Order model has this field if needed, or just keep it in VendorOrder
    });

    // Group items by store_id and create VendorOrders
    const itemsByStore: Record<string, any[]> = {};
    orderItems.forEach((item) => {
      const storeId = item.store_id?.toString();
      if (storeId) { // Check if storeId exists
        if (!itemsByStore[storeId]) {
            itemsByStore[storeId] = [];
        }
        itemsByStore[storeId].push(item);
      }
    });

    // Create VendorOrder for each store
    const vendorOrderPromises = Object.keys(itemsByStore).map(async (storeId) => {
      // Find the store to get the correct vendor_id if needed, 
      // but we mapped vendor_id in orderItems from cart population.
      // Let's grab the first item's vendor_id for this store group.
      const firstItem = itemsByStore[storeId][0]; // safe because we only add if storeId exists
      
      return VendorOrders.create({
        order_id: order._id,
        vendor_id: storeId, // maps to Stores collection based on previous code. NOTE: schema said vendor_id ref Stores.
        customer_id: userId,
        items: itemsByStore[storeId],
        delivery_option: deliveryMethod, 
        status: "pending",
      });
    });

    await Promise.all(vendorOrderPromises);
    
    // Decrement Product Stock
    // We can do this in parallel with vendor order creation or after.
    const stockUpdatePromises = orderItems.map((item) => {
        // Assuming Products model is imported as Products (need to check imports)
        // We need to import Products model at the top.
        return Products.findByIdAndUpdate(item.product_id, {
            $inc: { stockCount: -item.quantity }
        });
    });
    
    await Promise.all(stockUpdatePromises);
    
    // Clear Cart
    await Cart.deleteMany({ user_id: userId });

    return res.status(200).json({
      status: true,
      messsage: "Verification Successfull",
      data: resp.data,
    });
  } catch (err) {
    console.error(`Server Error v: ${err}`);
    return res.status(500).json({ message: `Server Error v: ${err}` });
  }
};
