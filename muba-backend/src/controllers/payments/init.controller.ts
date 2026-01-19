import express from "express";
import type { RequestHandler } from "express";
import { paystackConfig } from "../../../config/index.ts";
import PaymentIntents from "../../models/paymentIntent.model.ts";
import { orderId } from "../../utils/genId.utils.ts";
import Cart from "../../models/cart.model.ts"; 
import { toKobo } from "../../utils/currency.util.ts";
import Users from "../../models/users.model.ts";
import { calculateSplit } from "../../utils/paymentSplit.util.ts";
import Stores from "../../models/stores.model.ts";
import { createPendingOrder } from "../../services/orderProcessor.service.ts";
import crypto from "crypto";
import { isStorePayoutReady } from "../../utils/vendorGating.util.ts";

export const InitializePayment: RequestHandler = async (req, res) => {
  const { email, amount, metadata } = req.body;
  const reference = orderId();

  if (!email || !metadata?.userId) {
    return res.status(400).json({ error: "email and metadata.userId are required" });
  }

  try {
    // 1. Fetch User and Validate Identity
    const user = await Users.findById(metadata.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Validate Name and Phone (Safety Override)
    const firstName = user.firstname;
    const lastName = user.lastname;
    const phone = user.phone || metadata?.shippingInfo?.phone;

    if (!firstName || !lastName || !phone) {
        return res.status(400).json({ 
            error: "Incomplete user profile. First name, Last name, and Phone are required for checkout." 
        });
    }

    // 2. Fetch Cart Items
    const cartItems = await Cart.find({ user_id: metadata.userId }).populate("product_id");
    if (!cartItems || cartItems.length === 0) {
         return res.status(400).json({ error: "Cart is empty" });
    }

    // 3. Group by Vendor and Calculate Splits
    let subtotal = 0;
    const vendorMap: Record<string, { subtotal: number, subaccount: string, name: string, owner: string }> = {};
    
    for (const item of cartItems) {
        const product = item.product_id as any;
        if (!product || !product.store) continue;
        
        const store = await Stores.findById(product.store);
        if (!store) continue;
        
        // GATING CHECK
        const ready = await isStorePayoutReady(store._id.toString());
        if (!ready) {
            return res.status(400).json({ 
                message: `Vendor '${store.name}' is temporarily unavailable for payments. Please remove their items.`
            });
        }

        const storeId = store._id.toString();
        if (!vendorMap[storeId]) {
            vendorMap[storeId] = { 
                subtotal: 0, 
                subaccount: store.paystack_subaccount_code,
                name: store.name,
                owner: store.owner?.toString()
            };
        }
        
        const qty = item.quantity || 1;
        const itemPrice = product.price || 0;
        vendorMap[storeId].subtotal += (itemPrice * qty);
        subtotal += (itemPrice * qty);
    }

    if (Object.keys(vendorMap).length === 0) {
        return res.status(400).json({ error: "No valid vendors found in cart" });
    }

    // 4. Calculate Total Split
    const totalSplit = calculateSplit(subtotal);
    const amountKobo = toKobo(totalSplit.total_amount);

    // 5. Build Intent Data
    const formattedSplits = [];
    for (const storeId in vendorMap) {
        const v = vendorMap[storeId];
        const shareFraction = v.subtotal / subtotal;
        const vendorShareNaira = totalSplit.vendor_amount * shareFraction;
        
        formattedSplits.push({
            store_id: storeId,
            subaccount: v.subaccount,
            amount: vendorShareNaira,
            share: toKobo(vendorShareNaira)
        });
    }

    const cartSnapshot = cartItems.map((item: any) => {
        const storeId = (item.store || item.product_id?.store)?.toString();
        const vendorData = vendorMap[storeId];
        
        return {
            product_id: item.product_id?._id || item.product_id,
            store_id: storeId,
            vendor_id: vendorData?.owner, // Owner User ID
            quantity: item.quantity,
            price: item.price || item.product_id?.price,
            name: item.name || item.product_id?.title || item.product_id?.name,
            img: item.img || item.product_id?.img || []
        };
    });

    // 5b. Simple Cart Hash for integrity check
    const cartHash = crypto
        .createHash("md5")
        .update(JSON.stringify(cartSnapshot))
        .digest("hex");

    // 6. Create Payment Intent (ALIEXPRESS MODEL)
    const intent = await PaymentIntents.create({
        reference,
        user_id: metadata.userId,
        email,
        amount: totalSplit.total_amount,
        platform_fee: totalSplit.platform_fee,
        vendor_amount: totalSplit.vendor_amount,
        cart_snapshot: cartSnapshot,
        cart_hash: cartHash,
        vendor_splits: formattedSplits,
        shipping_info: metadata?.shippingInfo,
        status: "initiated"
    });

    // 6b. CREATE PENDING ORDER (MANDATORY SAFEGUARD)
    // This ensures an Order exists in DB before Paystack is even initialized.
    await createPendingOrder(intent._id.toString());

    // 6c. CLEAR CART IMMEDIATELY (per design: cart clears after order creation, before Paystack)
    console.log(`[InitPayment] 🛒 Clearing Cart for User: ${metadata.userId}`);
    await Cart.deleteMany({ user_id: metadata.userId });

    // 7. Handle Paystack Split Logic (STABLE FLOW)
    let split_code = "";
    try {
        const splitResponse = await fetch("https://api.paystack.co/split", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${paystackConfig.secret_key}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: `Order-${reference}`,
                type: "flat",
                currency: "NGN",
                subaccounts: formattedSplits.map(s => ({
                    subaccount: s.subaccount,
                    share: s.share
                })),
                bearer_type: "account",
            }),
        });

        const splitData = await splitResponse.json();
        if (splitData.status) {
            split_code = splitData.data.split_code;
        }
    } catch (splitErr) {
        console.error("[InitWithIntent] Split API Error:", splitErr);
    }

    // 8. Call Paystack Initialize (ATOMCITY STEP 3)
    const paystackInitBody: any = {
        email,
        amount: amountKobo,
        reference,
        metadata: {
            payment_intent_id: intent._id,
            userId: metadata.userId,
            fullName: `${firstName} ${lastName}`,
            phone,
            shippingInfo: metadata?.shippingInfo,
            platform_fee: totalSplit.platform_fee,
            vendor_amount: totalSplit.vendor_amount
        },
        // Enforce Customer Identity for Paystack Dashboard
        customer: {
            email,
            first_name: firstName,
            last_name: lastName,
            phone: phone
        },
        split_code,
        callback_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/verify/${intent.reference}`,
    };

    const reqt = await fetch(`${paystackConfig.init_url}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackConfig.secret_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackInitBody),
    });
    const resp = await reqt.json();

    if (!resp.status || !resp.data) {
        throw new Error(`Paystack Init Failed: ${resp.message}`);
    }

    return res.status(200).json({
      status: true,
      reference,
      authorization_url: resp.data.authorization_url,
    });
  } catch (err) {
    console.error(`Safe Payment Intent Error: ${err}`);
    return res.status(500).json({ message: `Server Error: ${err}` });
  }
};
