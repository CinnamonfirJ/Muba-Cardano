import { RequestHandler } from "express";
// import { json } from "stream/consumers";
import { paystackConfig } from "../../../config";
import Payments from "../../models/payment.models";
import { orderId } from "../../utils/genId.utils";
import Cart from "../../models/cart.model"; 
import { calculateDeliveryFee } from "../../utils/deliveryFee.util";
import { toKobo, toNaira } from "../../utils/currency.util";
import Users from "../../models/users.model";

export const InitializePayment: RequestHandler = async (req, res) => {
  const { email, amount, metadata } = req.body;
  const order_id = orderId();

  if (!email || !metadata?.userId) {
    return res.status(400).json({ error: "email and metadata.userId are required" });
  }

  try {
    // 0. Auto-Update User Profile if missing details (Phone/Location)
    // The Frontend sends shippingInfo in metadata.
    if (metadata?.shippingInfo) {
        const { phone, address } = metadata.shippingInfo;
        // We only want to update if the user MISSES this info, or we can just upsert.
        // User requested: "user profile will be updated with the current phone number and delivery location"
        const updateData: any = {};
        if (phone) updateData.phone = phone;
        if (address) updateData.delivery_location = address;
        
        // Also check matric if provided (optional)
        // Note: Matric serves as a unique key sometimes, so be careful.
        // Frontend Checkout might not send matric unless we add that field. 
        // Current checkout has: fullName, phone, address, email, deliveryMethod.
        
        if (Object.keys(updateData).length > 0) {
            await Users.findByIdAndUpdate(metadata.userId, {
                $set: updateData
            });
            console.log(`[InitPayment] Updated User ${metadata.userId} profile with shipping info.`);
        }
    }

    // 1. Fetch Cart Items (Source of Truth)
    const cartItems = await Cart.find({ user_id: metadata.userId }).populate("product_id");

    if (!cartItems || cartItems.length === 0) {
         return res.status(400).json({ error: "Cart is empty" });
    }

    // 2. Recalculate Subtotal
    let subtotal = 0;
    cartItems.forEach((item: any) => {
        // Enforce quantity check
        const qty = item.quantity || 1; 
        const price = item.product_id?.price ?? item.price;
        subtotal += (price * qty);
    });

    // 3. Calculate Fees
    const deliveryMethod = metadata.deliveryMethod || "school_post";
    
    // Standardized Calculation: Free over 10,000 for School Post
    let deliveryFee = calculateDeliveryFee(deliveryMethod);
    if (deliveryMethod === "school_post" && subtotal > 10000) {
        deliveryFee = 0;
    }
    
    // Service Fee: 2% (Matches Frontend)
    const serviceFee = Math.round(subtotal * 0.02);

    // 4. Calculate Total (Naira)
    const calculatedTotalNaira = subtotal + deliveryFee + serviceFee;
    
    // 5. Convert to Kobo for Paystack
    const amountKobo = toKobo(calculatedTotalNaira);

    // Update metadata with verified fees to ensure verify.controller uses THEM
    metadata.delivery_fee = deliveryFee;
    metadata.service_fee = serviceFee;

    console.log(`[InitPayment] Subtotal: ${subtotal}, Delivery: ${deliveryFee}, Service: ${serviceFee}`);
    console.log(`[InitPayment] Recalculated: ${calculatedTotalNaira} NGN -> ${amountKobo} Kobo`);

    const reqt = await fetch(`${paystackConfig.init_url}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackConfig.secret_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountKobo, // TRUST BACKEND CALC
        metadata,
        callback_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify`,
      }),
    });
    const resp = await reqt.json();
    console.log(resp);

    if (!resp.status || !resp.data) {
        throw new Error(`Paystack Init Failed: ${resp.message}`);
    }

    const tx = await Payments.create({
      _id: order_id,
      userId: metadata.userId, 
      email,
      amount: calculatedTotalNaira, // Store in NAIRA (Source of Truth for Finances)
      status: "pending",
      reference: resp.data.reference,
    });

    return res.status(200).json({
      status: true,
      tx,
      authorization_url: resp.data.authorization_url,
    });
  } catch (err) {
    console.error(`Server Error: ${err}`);
    return res.status(500).json({ message: `Server Error: ${err}` });
  }
};
