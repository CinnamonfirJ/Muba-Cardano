/**
 * Paystack Subaccount Verification Utility
 * 
 * Checks whether a vendor's Paystack subaccount is verified and active.
 * This is CRITICAL for payout safety - funds should NEVER route to platform
 * when vendor subaccounts are unverified.
 */

import { paystackConfig } from "../../config/index.ts";

export interface SubaccountStatus {
    verified: boolean;
    active: boolean;
    settlement_bank: string;
    account_number: string;
    business_name: string;
    percentage_charge: number;
}

/**
 * Fetches subaccount details from Paystack and checks verification status.
 * 
 * @param subaccountCode - The Paystack subaccount code (ACCT_xxxxxxxx)
 * @returns SubaccountStatus if found, null if not found or error
 */
export const checkSubaccountVerification = async (
    subaccountCode: string
): Promise<SubaccountStatus | null> => {
    if (!subaccountCode || !subaccountCode.startsWith('ACCT_')) {
        console.warn(`[PaystackVerification] Invalid subaccount code: ${subaccountCode}`);
        return null;
    }

    try {
        const response = await fetch(
            `https://api.paystack.co/subaccount/${subaccountCode}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${paystackConfig.secret_key}`,
                },
            }
        );

        const data = await response.json();

        if (!data.status || !data.data) {
            console.warn(`[PaystackVerification] Subaccount not found: ${subaccountCode}`);
            return null;
        }

        const subaccount = data.data;

        // Paystack subaccount structure:
        // - active: boolean (whether subaccount can receive payments)
        // - is_verified: boolean (whether bank details are verified)
        // Note: Field names may vary, check Paystack docs if issues arise

        return {
            verified: subaccount.is_verified ?? false,
            active: subaccount.active ?? false,
            settlement_bank: subaccount.settlement_bank || "",
            account_number: subaccount.account_number || "",
            business_name: subaccount.business_name || "",
            percentage_charge: subaccount.percentage_charge ?? 0,
        };
    } catch (error) {
        console.error(`[PaystackVerification] Error checking subaccount:`, error);
        return null;
    }
};

/**
 * Syncs a store's payout_ready status with Paystack verification.
 * Call this when vendor logs in, opens dashboard, or via cron job.
 * 
 * @param store - The store document (must have .save() method)
 * @returns true if payout_ready was updated to true, false otherwise
 */
export const syncPaystackVerification = async (store: any): Promise<boolean> => {
    // Only sync if verification was requested but not yet ready
    if (!store.verification_requested || store.payout_ready) {
        return false;
    }

    // Must have subaccount code
    if (!store.paystack_subaccount_code) {
        return false;
    }

    const status = await checkSubaccountVerification(store.paystack_subaccount_code);

    if (status?.verified && status?.active) {
        console.log(`[PaystackVerification] ✅ Store ${store.name} is now verified!`);
        store.payout_ready = true;
        await store.save();
        return true;
    }

    return false;
};
