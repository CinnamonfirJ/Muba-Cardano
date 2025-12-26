import { RequestHandler } from "express";
import { paystackConfig } from "../../../config";
import Payments from "../../models/payment.models";
import Cart from "../../models/cart.model";
import Orders from "../../models/order.model";
import VendorOrders from "../../models/vendorOrder.model";
import Products from "../../models/products.model";
import { nanoid } from "nanoid";
import { calculateDeliveryFee } from "../../utils/deliveryFee.util";
import { ORDER_STATUSES } from "../../utils/orderStatus.util";
import { toNaira } from "../../utils/currency.util";

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

    const deliveryMethod = resp.data.metadata?.deliveryMethod;
    if (!deliveryMethod) {
        throw new Error("Missing deliveryMethod in payment metadata - Cannot default delivery");
    }

    // Prioritize Fees from Metadata (Set during Init) to ensure consistency
    const deliveryFee = resp.data.metadata?.delivery_fee !== undefined 
        ? Number(resp.data.metadata.delivery_fee) 
        : calculateDeliveryFee(deliveryMethod);
        
    const serviceFee = resp.data.metadata?.service_fee !== undefined 
        ? Number(resp.data.metadata.service_fee) 
        : 0;

    const orderItems = cartItems.map((item) => {
      // INVARIANT: Quantity is source of truth. NO defaults.
      if (!item.quantity || item.quantity < 1) {
          throw new Error(`Invalid Cart Quantity for item ${item._id}: ${item.quantity}`);
      }
      return {
        product_id: item.product_id,
        vendor_id: item.store?.owner, 
        store_id: item.store?._id,
        quantity: item.quantity, 
        price: item.price,
        name: item.name,
        img: item.img,
      };
    });

    // Validations passed. Create Order.
    const order = await Orders.create({
      user_id: userId,
      items: orderItems,
      payment_reference: reference,
      total: toNaira(resp.data.amount), // Convert Kobo to Naira
      delivery_fee: deliveryFee,
      service_fee: serviceFee,
      status: "paid",
      delivery_method: deliveryMethod
    });

    // Group items by store_id
    const itemsByStore: Record<string, any[]> = {};
    orderItems.forEach((item) => {
      const storeId = item.store_id?.toString();
      if (storeId) { 
        if (!itemsByStore[storeId]) itemsByStore[storeId] = [];
        itemsByStore[storeId].push(item);
      }
    });

    // Create VendorOrder for each store
    const vendorOrderPromises = Object.keys(itemsByStore).map(async (storeId, index) => {
      const refId = nanoid(6).toUpperCase(); // Singleton RefId for this package
      
      let deliveryFeeItem = 0;
      let serviceFeeItem = 0;
      
      if (index === 0) {
        // Apply synchronized fees to the first shipment/order chunk
        deliveryFeeItem = deliveryFee;
        serviceFeeItem = serviceFee; 
      }

      const items = itemsByStore[storeId].map(item => ({
          product_id: item.product_id,
          quantity: item.quantity, 
          price: item.price,
          name: item.name,
          img: item.img,
          variant: item.variant
        }));

      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalAmount = subtotal + deliveryFeeItem + serviceFeeItem;
      
      // QR Codes: Distinct codes derived from refId but with random security token
      const vendorQrCode = `${refId}-${nanoid(5).toUpperCase()}`;
      const clientQrCode = `${refId}-${nanoid(5).toUpperCase()}`;

      const vo = await VendorOrders.create({
        refId: refId,
        order_id: order._id,
        vendor_id: storeId, 
        customer_id: userId,
        items: items,
        delivery_option: deliveryMethod,
        delivery_fee: deliveryFeeItem,
        service_fee: serviceFeeItem,
        total_amount: totalAmount,
        vendor_qr_code: vendorQrCode,
        client_qr_code: clientQrCode,
        is_pickup_order: deliveryMethod === "school_post",
        status: ORDER_STATUSES.ORDER_CONFIRMED,
      });

      // Sync to Parent Order Items
      await Orders.updateOne(
        { _id: order._id },
        { 
          $set: { 
            "items.$[elem].refId": refId,
            "items.$[elem].vendor_qr_code": vendorQrCode,
            "items.$[elem].client_qr_code": clientQrCode,
            "items.$[elem].status": ORDER_STATUSES.ORDER_CONFIRMED
          } 
        },
        { arrayFilters: [{ "elem.store_id": String(storeId) }] }
      );

      return vo;
    });

    await Promise.all(vendorOrderPromises);
    
    // Decrement Stock
    const stockUpdatePromises = orderItems.map((item) => {
        return Products.findByIdAndUpdate(item.product_id, {
            $inc: { stockCount: -item.quantity }
        });
    });
    
    await Promise.all(stockUpdatePromises);
    await Cart.deleteMany({ user_id: userId });

    return res.status(200).json({
      status: true,
      message: "Verification Successful",
      data: resp.data,
    });
  } catch (err) {
    console.error(`Server Error v: ${err}`);
    return res.status(500).json({ message: `Server Error v: ${err}` });
  }
};
