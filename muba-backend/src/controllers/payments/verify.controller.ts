import type { Request, Response } from "express";
import Orders from "../../models/order.model.ts";
import { fulfillOrder } from "../../services/orderProcessor.service.ts";
import { paystackConfig } from "../../../config/index.ts";
import fetch from "node-fetch";

/**
 * Authoritative Verify Controller.
 * Updates Order/VendorOrders to 'paid' only after Paystack confirmation.
 */
export const VerifyTransaction = async (req: Request, res: Response) => {
    const { reference } = req.params;

    if (!reference) {
        return res.status(400).json({ success: false, message: "Reference is required" });
    }

    try {
        console.log(`[VerifyController] 🔎 Verifying Reference: ${reference}`);

        // 1. Double check order status locally first (Optimization)
        const order = await Orders.findOne({ payment_reference: reference });
        if (order && order.status === "paid") {
            return res.status(200).json({ 
                success: true, 
                message: "Order already fulfilled", 
                data: order 
            });
        }

        // 2. Call Paystack Verify API (The single source of truth for payment)
        const response = await fetch(`${paystackConfig.verify_url}/${reference}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${paystackConfig.secret_key}`,
            },
        });

        const result: any = await response.json();

        if (result.status && result.data.status === "success") {
            // 3. SECURE FULFILLMENT: Atomically update order and clear cart
            // Since order was created BEFORE payment, we just fulfill it.
            const fulfilledOrder = await fulfillOrder(reference);

            return res.status(200).json({
                success: true,
                message: "Payment verified and order fulfilled",
                data: fulfilledOrder
            });
        }

        // Payment not successful yet or failed
        return res.status(400).json({
            success: false,
            message: result.message || "Payment verification failed",
            data: result.data
        });

    } catch (error: any) {
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, message: "Internal server error during verification" });
    }
};
