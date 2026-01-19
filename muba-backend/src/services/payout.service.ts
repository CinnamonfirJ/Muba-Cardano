import { paystackConfig } from "../../config/index.ts";
import VendorOrders from "../models/vendorOrder.model.ts";
import Stores from "../models/stores.model.ts";
import { toKobo } from "../utils/currency.util.ts";

/**
 * NOTE: Manual payout initiation via Transfer API is DEPRECATED.
 * All payouts are now handled automatically via Paystack Split Payments.
 * This service is kept for audit/logging or potential manual refund overrides for admins.
 */

/**
 * Initiates a Transfer via Paystack API (Manual Override Only)
 */
export const initiateTransfer = async (
    amount: number, 
    recipient_subaccount: string, 
    reference: string, 
    reason: string
) => {
    // ⚠️ RE-ROUTE: Use Subaccount-based transfers if needed, but primary flow is splits.
    // For manual transfers out of main balance to a subaccount:
    try {
        const response = await fetch("https://api.paystack.co/transfer", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${paystackConfig.secret_key}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                source: "balance",
                amount: toKobo(amount),
                recipient: recipient_subaccount, // Actually Paystack expects a Recipient Code or Subaccount
                reference,
                reason
            }),
        });

        const data = await response.json();
        return data; 
    } catch (error: any) {
        console.error("Manual Transfer Error:", error);
        throw error;
    }
};

/**
 * Stub for legacy payout processing.
 * Normal orders are settled via splits; this no longer triggers automatically.
 */
export const processOrderPayout = async (vendorOrderId: string) => {
    console.log(`[PayoutService] split-settlement handled automatically. Skipping manual payout for ${vendorOrderId}`);
    return;
};
