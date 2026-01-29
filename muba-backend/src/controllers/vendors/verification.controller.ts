/**
 * Vendor Payout Verification Controller
 * 
 * Handles vendor requests to verify their payout account.
 * When vendor clicks "Verify Account", this:
 * 1. Marks `verification_requested = true`
 * 2. Sends admin email notification
 * 3. Returns message to vendor about review timeline
 */

import type { Request, Response } from "express";
import Stores from "../../models/stores.model.ts";
import Users from "../../models/users.model.ts";
import { SendEmail } from "../../utils/sendEmail.utils.ts";
import { appConfig } from "../../../config/index.ts";
import { syncPaystackVerification, checkSubaccountVerification } from "../../utils/paystackVerification.util.ts";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Request Payout Verification
 * POST /vendor/request-payout-verification
 * 
 * Body: { storeId: string }
 */
export const RequestPayoutVerification = async (req: Request, res: Response) => {
    const { storeId } = req.body;
    const user = (req as any).user;

    if (!storeId) {
        return res.status(400).json({ message: "storeId is required" });
    }

    try {
        // 1. Find store owned by this user
        const store = await Stores.findOne({ _id: storeId, owner: user._id });
        if (!store) {
            return res.status(404).json({ message: "Store not found or unauthorized" });
        }

        // 2. Check if subaccount exists
        if (!store.paystack_subaccount_code) {
            return res.status(400).json({ 
                message: "Please set up your payout account first before requesting verification." 
            });
        }

        // 3. Check if already verified
        if (store.payout_ready) {
            return res.status(200).json({ 
                success: true,
                message: "Your payout account is already verified. You're ready to sell!",
                payout_ready: true
            });
        }

        // 4. Check if already requested
        if (store.verification_requested) {
            return res.status(200).json({ 
                success: true,
                message: "Verification already requested. Please wait 3-5 business days for review.",
                verification_requested: true,
                verification_requested_at: store.verification_requested_at
            });
        }

        // 5. Mark verification as requested
        store.verification_requested = true;
        store.verification_requested_at = new Date();
        await store.save();

        // 6. Get vendor details for email
        const vendor = await Users.findById(user._id);

        // 7. Send admin notification email
        try {
            const templatePath = path.join(__dirname, "../../emailTemplates/verificationRequest.email.html");
            let emailTemplate = fs.readFileSync(templatePath, "utf8");

            emailTemplate = emailTemplate
                .replace(/{{store_name}}/g, store.name)
                .replace(/{{vendor_name}}/g, `${vendor?.firstname || ""} ${vendor?.lastname || ""}`.trim())
                .replace(/{{vendor_email}}/g, vendor?.email || "N/A")
                .replace(/{{subaccount_code}}/g, store.paystack_subaccount_code || "N/A")
                .replace(/{{bank_name}}/g, store.bank_name || "N/A")
                .replace(/{{account_number}}/g, store.account_number || "N/A")
                .replace(/{{requested_at}}/g, new Date().toLocaleString());

            await SendEmail({
                email: appConfig.admin as string,
                title: "🔔 New Vendor Subaccount Verification Request",
                html: emailTemplate
            });

            console.log(`[Verification] 📧 Admin notified for store: ${store.name}`);
        } catch (emailError) {
            console.error("[Verification] Email failed:", emailError);
            // Don't fail the request if email fails
        }

        return res.status(200).json({
            success: true,
            message: "Verification requested successfully! Your payout account is under review. This usually takes 3-5 business days.",
            verification_requested: true,
            verification_requested_at: store.verification_requested_at
        });

    } catch (error: any) {
        console.error("[Verification] Error:", error);
        return res.status(500).json({ message: error.message || "Server Error" });
    }
};

/**
 * Check Verification Status & Subaccount Details
 * GET /vendor/payout-status/:storeId
 * 
 * Fetches live details from Paystack to ensure accuracy.
 */
export const GetPayoutStatus = async (req: Request, res: Response) => {
    const { storeId } = req.params;
    const user = (req as any).user;

    try {
        const store = await Stores.findOne({ _id: storeId, owner: user._id });
        if (!store) {
            return res.status(404).json({ message: "Store not found or unauthorized" });
        }

        let paystackDetails = null;

        // Fetch live subaccount details if code exists
        if (store.paystack_subaccount_code) {
             const status = await checkSubaccountVerification(store.paystack_subaccount_code);
             
             if (status) {
                 paystackDetails = status;
                 
                 // Auto-sync local state while we're here
                 if (status.verified && status.active && !store.payout_ready) {
                     store.payout_ready = true;
                     await store.save();
                 } else if ((!status.verified || !status.active) && store.payout_ready) {
                     // If Paystack says not verified/active, update local state
                     store.payout_ready = false;
                     await store.save();
                 }
             }
        }

        return res.status(200).json({
            success: true,
            data: {
                has_subaccount: !!store.paystack_subaccount_code,
                subaccount_code: store.paystack_subaccount_code || null,
                bank_name: store.bank_name || null,
                account_number: store.account_number || null,
                verification_requested: store.verification_requested || false,
                verification_requested_at: store.verification_requested_at || null,
                payout_ready: store.payout_ready || false,
                // Live details from Paystack
                paystack_details: paystackDetails 
            }
        });

    } catch (error: any) {
        console.error("[PayoutStatus] Error:", error);
        return res.status(500).json({ message: error.message || "Server Error" });
    }
};
