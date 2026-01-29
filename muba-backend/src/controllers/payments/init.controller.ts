import express from "express";
import type { RequestHandler } from "express";
import { paystackConfig } from "../../../config/index.ts";
import PaymentIntents from "../../models/paymentIntent.model.ts";
import { orderId } from "../../utils/genId.utils.ts";
import Cart from "../../models/cart.model.ts"; 
import { toKobo } from "../../utils/currency.util.ts";
import Users from "../../models/users.model.ts";
import { calculateVendorFee } from "../../utils/paymentSplit.util.ts";
import Stores from "../../models/stores.model.ts";
import { createPendingOrder } from "../../services/orderProcessor.service.ts";
import crypto from "crypto";
import { isStorePayoutReady } from "../../utils/vendorGating.util.ts";
import { getCartTotal } from "../../utils/pricing.util.ts";

/**
 * PAYSTACK SUBACCOUNT CHARGING MODEL
 * 
 * Architecture:
 * - Each vendor receives payment directly to their subaccount
 * - Platform fee is extracted via `transaction_charge`
 * - `bearer: "subaccount"` means vendor pays Paystack fees
 * - Multi-vendor carts create separate transactions per vendor
 * 
 * Money Flow:
 * Customer → Paystack → Vendor Subaccount (after deducting platform fee + Paystack fees)
 *                    → Platform (transaction_charge)
 *                    → Paystack (processing fees)
 */

interface VendorPaymentData {
    storeId: string;
    storeName: string;
    subaccountCode: string;
    ownerId: string;
    subtotal: number;
    platformFee: number;
    vendorAmount: number;
    items: any[];
}

export const InitializePayment: RequestHandler = async (req, res) => {
    const { email, amount, metadata } = req.body;
    const masterReference = orderId();

    if (!email || !metadata?.userId) {
        return res.status(400).json({ error: "email and metadata.userId are required" });
    }

    try {
        // 1. Fetch User and Validate Identity
        const user = await Users.findById(metadata.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

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

        // 3. Group Cart Items by Vendor
        const vendorMap: Map<string, VendorPaymentData> = new Map();
        
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

            // Validate subaccount exists
            if (!store.paystack_subaccount_code) {
                return res.status(400).json({ 
                    message: `Vendor '${store.name}' has not completed payment setup. Please contact support.`
                });
            }

            const storeId = store._id.toString();
            const qty = item.quantity || 1;
            // Use Cart Item Price (which is the Variant Price)
            const itemPrice = item.price || product.price || 0;
            const itemTotal = itemPrice * qty;

            if (!vendorMap.has(storeId)) {
                vendorMap.set(storeId, {
                    storeId,
                    storeName: store.name,
                    subaccountCode: store.paystack_subaccount_code,
                    ownerId: store.owner?.toString(),
                    subtotal: 0,
                    platformFee: 0,
                    vendorAmount: 0,
                    items: []
                });
            }

            const vendorData = vendorMap.get(storeId)!;
            vendorData.subtotal += itemTotal;
            // Push full details including variant info
            vendorData.items.push({
                product_id: product._id,
                store_id: storeId,
                vendor_id: vendorData.ownerId,
                quantity: qty,
                price: itemPrice, 
                name: product.title || product.name,
                img: item.img.length ? item.img : (product.img || []),
                variant_selected: (item as any).variant_details 
            });
        }

        if (vendorMap.size === 0) {
            return res.status(400).json({ error: "No valid vendors found in cart" });
        }

        // 4. Calculate fees for each vendor
        const vendorPayments: VendorPaymentData[] = [];
        let orderSubtotal = 0;
        let totalVendorPlatformFee = 0;

        for (const [storeId, data] of vendorMap) {
            const feeCalc = calculateVendorFee(data.subtotal);
            data.platformFee = feeCalc.fee;
            data.vendorAmount = feeCalc.vendorAmount;
            vendorPayments.push(data);
            
            orderSubtotal += data.subtotal;
            totalVendorPlatformFee += feeCalc.fee;
        }

        // 4b. Calculate Customer Service Fee
        const cartPricing = getCartTotal(vendorPayments.map(v => ({ price: v.subtotal, quantity: 1 })));
        const customerServiceFee = cartPricing.serviceFee;
        const totalOrderAmount = cartPricing.total;
        const totalPlatformFee = totalVendorPlatformFee + customerServiceFee;

        // 5. Build cart snapshot for database
        const cartSnapshot = vendorPayments.flatMap(v => v.items);

        // 5b. Cart hash for integrity
        const cartHash = crypto
            .createHash("md5")
            .update(JSON.stringify(cartSnapshot))
            .digest("hex");

        // 6. Build vendor splits for database record
        const vendorSplits = vendorPayments.map(v => ({
            store_id: v.storeId,
            subaccount: v.subaccountCode,
            amount: v.vendorAmount,      // In Naira
            share: toKobo(v.subtotal),   // Order amount in Kobo
            platform_fee: v.platformFee  // Platform fee for this vendor
        }));

        // 7. Create Payment Intent (Single master intent for the order)
        const intent = await PaymentIntents.create({
            reference: masterReference,
            user_id: metadata.userId,
            email,
            amount: totalOrderAmount,
            platform_fee: customerServiceFee, // Customer-facing service fee (₦100)
            vendor_amount: orderSubtotal,     // Sum of base prices
            cart_snapshot: cartSnapshot,
            cart_hash: cartHash,
            vendor_splits: vendorSplits,
            shipping_info: metadata?.shippingInfo,
            status: "initiated"
        });

        // 8. Create Pending Order
        await createPendingOrder(intent._id.toString());

        // 9. Clear Cart
        console.log(`[InitPayment] 🛒 Clearing Cart for User: ${metadata.userId}`);
        await Cart.deleteMany({ user_id: metadata.userId });

        // 10. Initialize Paystack Transaction(s) using SUBACCOUNT CHARGING
        // For multi-vendor: We initialize for the FIRST vendor, others handled separately
        // For single vendor: Direct subaccount charging
        
        if (vendorPayments.length === 1) {
            // SINGLE VENDOR - Direct subaccount charging (ideal case)
            const vendor = vendorPayments[0];
            
            // DEBUG: Log the subaccount being used
            console.log(`[InitPayment] 💳 Subaccount Charging Debug:`);
            console.log(`  Store: ${vendor.storeName} (${vendor.storeId})`);
            console.log(`  Subaccount Code: "${vendor.subaccountCode}"`);
            console.log(`  Amount: ₦${vendor.subtotal} (${toKobo(vendor.subtotal)} kobo)`);
            console.log(`  Platform Fee: ₦${vendor.platformFee} (${toKobo(vendor.platformFee)} kobo)`);

            // Validate subaccount code format (should be ACCT_xxxxxxxx)
            if (!vendor.subaccountCode || !vendor.subaccountCode.startsWith('ACCT_')) {
                console.error(`[InitPayment] ❌ Invalid subaccount format: "${vendor.subaccountCode}"`);
                return res.status(400).json({ 
                    error: `Vendor '${vendor.storeName}' has invalid payment setup. Subaccount code is malformed.`
                });
            }
            
            const paystackInitBody = {
                email,
                amount: toKobo(vendor.subtotal + customerServiceFee),  // Total charged to customer
                reference: masterReference,
                subaccount: vendor.subaccountCode,
                transaction_charge: toKobo(vendor.platformFee + customerServiceFee),  // Total platform cut
                bearer: "subaccount",  // Vendor pays Paystack processing fees
                metadata: {
                    payment_intent_id: intent._id,
                    userId: metadata.userId,
                    fullName: `${firstName} ${lastName}`,
                    phone,
                    shippingInfo: metadata?.shippingInfo,
                    platform_fee: vendor.platformFee,
                    vendor_amount: vendor.vendorAmount,
                    vendor_count: 1
                },
                customer: {
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone
                },
                callback_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/verify/${masterReference}`,
            };

            const response = await fetch(`${paystackConfig.init_url}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${paystackConfig.secret_key}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(paystackInitBody),
            });
            const resp = await response.json();

            if (!resp.status || !resp.data) {
                console.error(`[InitPayment] ❌ Paystack Error:`, resp);
                throw new Error(`Paystack Init Failed: ${resp.message}`);
            }

            return res.status(200).json({
                status: true,
                reference: masterReference,
                authorization_url: resp.data.authorization_url,
                vendor_count: 1
            });
        } else {
            // MULTI-VENDOR - Create separate transactions per vendor
            // Frontend will handle sequential payment flow
            const vendorTransactions: Array<{
                reference: string;
                store_id: string;
                store_name: string;
                amount: number;
                authorization_url?: string;
            }> = [];

            for (let i = 0; i < vendorPayments.length; i++) {
                const vendor = vendorPayments[i];
                const vendorRef = `${masterReference}-V${i + 1}`;

                // DEBUG: Log the subaccount being used
                console.log(`[InitPayment] 💳 Multi-Vendor ${i + 1}/${vendorPayments.length}:`);
                console.log(`  Store: ${vendor.storeName}`);
                console.log(`  Subaccount Code: "${vendor.subaccountCode}"`);

                // Validate subaccount code format
                if (!vendor.subaccountCode || !vendor.subaccountCode.startsWith('ACCT_')) {
                    console.error(`[InitPayment] ❌ Invalid subaccount format for ${vendor.storeName}`);
                    vendorTransactions.push({
                        reference: vendorRef,
                        store_id: vendor.storeId,
                        store_name: vendor.storeName,
                        amount: vendor.subtotal
                    });
                    continue;
                }

                const paystackInitBody = {
                    email,
                    amount: toKobo(vendor.subtotal + (i === 0 ? customerServiceFee : 0)),
                    reference: vendorRef,
                    subaccount: vendor.subaccountCode,
                    transaction_charge: toKobo(vendor.platformFee + (i === 0 ? customerServiceFee : 0)),
                    bearer: "subaccount",
                    metadata: {
                        payment_intent_id: intent._id,
                        master_reference: masterReference,
                        vendor_index: i + 1,
                        vendor_total: vendorPayments.length,
                        userId: metadata.userId,
                        fullName: `${firstName} ${lastName}`,
                        phone,
                        shippingInfo: metadata?.shippingInfo,
                        platform_fee: vendor.platformFee,
                        vendor_amount: vendor.vendorAmount,
                        store_id: vendor.storeId,
                        store_name: vendor.storeName
                    },
                    customer: {
                        email,
                        first_name: firstName,
                        last_name: lastName,
                        phone: phone
                    },
                    callback_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/verify/${masterReference}?vendor=${i + 1}`,
                };

                const response = await fetch(`${paystackConfig.init_url}`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${paystackConfig.secret_key}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(paystackInitBody),
                });
                const resp = await response.json();

                if (!resp.status || !resp.data) {
                    console.error(`[InitPayment] Vendor ${i + 1} init failed:`, resp.message);
                    vendorTransactions.push({
                        reference: vendorRef,
                        store_id: vendor.storeId,
                        store_name: vendor.storeName,
                        amount: vendor.subtotal
                    });
                } else {
                    vendorTransactions.push({
                        reference: vendorRef,
                        store_id: vendor.storeId,
                        store_name: vendor.storeName,
                        amount: vendor.subtotal,
                        authorization_url: resp.data.authorization_url
                    });
                }
            }

            // Return all vendor transactions for frontend to handle
            return res.status(200).json({
                status: true,
                reference: masterReference,
                vendor_count: vendorPayments.length,
                total_amount: totalOrderAmount,
                vendors: vendorTransactions,
                // First vendor's URL for immediate redirect
                authorization_url: vendorTransactions[0]?.authorization_url
            });
        }
    } catch (err) {
        console.error(`[InitPayment] Error: ${err}`);
        return res.status(500).json({ message: `Server Error: ${err}` });
    }
};
