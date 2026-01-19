import type { Request, Response } from "express";
import crypto from "crypto";
import { paystackConfig } from "../../../config/index.ts";
import { fulfillOrder } from "../../services/orderProcessor.service.ts";

/**
 * Stable Paystack Webhook Handler.
 * Does NOT create orders. Only fulfills existing pending orders.
 */
export const PaystackWebhook = async (req: Request, res: Response) => {
    try {
        const secret = paystackConfig.secret_key;
        const signature = req.headers["x-paystack-signature"];
        
        // 1. Verify Signature
        const rawBody = (req as any).rawBody || JSON.stringify(req.body);
        const hash = crypto
            .createHmac("sha512", secret as string)
            .update(rawBody)
            .digest("hex");

        if (hash !== signature) {
            console.error("[Webhook] ❌ Invalid Signature mismatch.");
            return res.status(401).send("Invalid signature");
        }

        const event = req.body;
        console.log(`[Webhook] 🔔 Event Received: ${event.event}`);

        if (event.event === "charge.success") {
            const { reference } = event.data;

            console.log(`[Webhook] ✅ Payment Success for Ref: ${reference}`);

            try {
                // Since Order was created during Initialize stage, we just fulfill it.
                // This handles cases where the user closes the browser before verify page loads.
                const order = await fulfillOrder(reference);
                console.log(`[Webhook] 🚀 Order Fulfilled: ${order._id}`);
            } catch (err: any) {
                console.error(`[Webhook] 💥 Fulfillment Failed: ${err.message}`);
            }
        }

        return res.status(200).json({ status: "success" });
    } catch (error) {
        console.error("[Webhook] 💀 Critical Webhook Error:", error);
        return res.status(500).send("Internal Server Error");
    }
};
