import Orders from "../models/order.model.ts";
import VendorOrders from "../models/vendorOrder.model.ts";
import PaymentIntents from "../models/paymentIntent.model.ts";
import { orderId as generateRefId } from "../utils/genId.utils.ts";
import Payments from "../models/payment.models.ts";
import { calculateSplit } from "../utils/paymentSplit.util.ts";

/**
 * Creates Order and VendorOrder records with 'pending_payment' status.
 * This is the FIRST step in the new stable verification flow.
 */
export const createPendingOrder = async (intentId: string) => {
    console.log(`[OrderProcessor] 📝 Creating Pending Order for Intent: ${intentId}`);
    
    const intent = await PaymentIntents.findById(intentId);
    if (!intent) {
        throw new Error(`PaymentIntent not found: ${intentId}`);
    }

    // Check if order already exists for this reference
    const existingOrder = await Orders.findOne({ payment_reference: intent.reference });
    if (existingOrder) {
        console.log(`[OrderProcessor] 🔗 Order already exists for Ref: ${intent.reference}`);
        return existingOrder;
    }

    // 1. Create Main Order (Pending Payment)
    const mainOrder = await Orders.create({
        user_id: intent.user_id,
        items: intent.cart_snapshot.map((item: any) => ({
            ...item,
            status: "pending_payment"
        })),
        payment_reference: intent.reference,
        total: intent.amount,
        service_fee: intent.platform_fee,
        status: "pending" // Overall order status stays pending until paid
    });

    console.log(`[OrderProcessor] ✅ Pending Main Order Created: ${mainOrder._id}`);

    // 2. Create Vendor Orders (Pending Payment)
    const storeMap: Record<string, any[]> = {};
    intent.cart_snapshot.forEach((item: any) => {
        const sid = item.store_id.toString();
        if (!storeMap[sid]) storeMap[sid] = [];
        storeMap[sid].push(item);
    });

    for (const storeId in storeMap) {
        const items = storeMap[storeId];
        const splitInfo = intent.vendor_splits.find((s: any) => 
            s.store_id?.toString() === storeId
        );

        // Calculate financial breakdown for this vendor
        const vendorSubtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const vendorSplit = calculateSplit(vendorSubtotal);

        await VendorOrders.create({
            refId: generateRefId(),
            order_id: mainOrder._id,
            vendor_id: storeId,
            customer_id: intent.user_id,
            items: items.map(i => ({
                product_id: i.product_id,
                quantity: i.quantity,
                price: i.price,
                name: i.name,
                img: i.img
            })),
            delivery_option: intent.shipping_info?.deliveryMethod || "school_post",
            delivery_fee: 0,
            total_amount: vendorSubtotal,
            platform_fee: vendorSplit.platform_fee,
            vendor_earnings: vendorSplit.vendor_amount,
            status: "pending_payment",
            paystack_subaccount_code: splitInfo?.subaccount
        });
    }

    // Update intent with order_id
    intent.order_id = mainOrder._id;
    await intent.save();

    return mainOrder;
};

/**
 * Fulfills an existing pending order.
 * Called by Verify page or Webhook.
 */
export const fulfillOrder = async (reference: string) => {
    console.log(`[OrderProcessor] ⚡ Fulfilling Order for Ref: ${reference}`);

    const order = await Orders.findOne({ payment_reference: reference });
    if (!order) {
        throw new Error(`Order not found for reference: ${reference}`);
    }

    if (order.status === "paid") {
        console.log(`[OrderProcessor] ♻️ Order ${reference} already marked as paid.`);
        return order;
    }

    // 1. Update Main Order
    order.status = "paid";
    order.items.forEach((item: any) => { item.status = "paid"; });
    await order.save();

    // 2. Update Vendor Orders
    await VendorOrders.updateMany(
        { order_id: order._id },
        { status: "paid" }
    );

    // 3. Create Legacy Payment Record
    const intent = await PaymentIntents.findOne({ reference });
    await Payments.create({
        _id: order._id.toString(),
        userId: order.user_id,
        email: intent?.email || "", // Mandatory field
        amount: order.total,
        status: "paid",
        reference: reference,
        paid_at: new Date()
    });

    // 4. Update PaymentIntent
    if (intent) {
        intent.status = "completed";
        await intent.save();
    }

    // Note: Cart is already cleared during payment initialization
    // See init.controller.ts step 6c

    return order;
};
