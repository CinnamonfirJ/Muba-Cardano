import type { Request, Response } from "express";
import { paystackConfig } from "../../../config/index.ts";
import Stores from "../../models/stores.model.ts";
import Users from "../../models/users.model.ts";

/**
 * Creates or Updates a Paystack Subaccount
 * Docs: https://paystack.com/docs/api/subaccount/#create
 */
export const CreateSubaccount = async (req: Request, res: Response) => {
    const { 
        storeId, 
        account_number, 
        bank_code,
        bank_name 
    } = req.body;
    
    const user = (req as any).user; 

    if (!storeId || !account_number || !bank_code) {
        return res.status(400).json({ message: "Missing required bank details" });
    }

    // 🎯 MARKETPLACE GATING REQUIREMENT
    // Vendor must have phone and matric number to onboard for payouts
    const fullUser = await Users.findById(user._id);
    if (!fullUser?.phone || !fullUser?.matric_number) {
        return res.status(400).json({ 
            message: "Profile incomplete. Please ensure your Phone Number and Matric Number are set before setting up payouts." 
        });
    }

    try {
        const store = await Stores.findOne({ _id: storeId, owner: user._id });
        if (!store) {
            return res.status(404).json({ message: "Store not found or unauthorized" });
        }

        // 1. Resolve Account Name
        const resolveResp = await fetch(`https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`, {
            headers: {
                Authorization: `Bearer ${paystackConfig.secret_key}`
            }
        });
        
        const resolveData = await resolveResp.json();
        if (!resolveData.status) {
            return res.status(400).json({ message: "Could not resolve account details. Please check the number and bank." });
        }
        
        const accountName = resolveData.data.account_name;

        // 2. Create or Update Subaccount
        // If store already has a subaccount, we might want to update it. 
        // For simplicity and to satisfy "Fail fast", we create a new one if not present.
        
        const subaccountPayload = {
            business_name: `${store.name} (${accountName})`,
            settlement_bank: bank_code,
            account_number: account_number,
            percentage_charge: 0, // We handle platform fees manually via Split API during transaction init
            primary_contact_email: fullUser.email,
            primary_contact_name: `${fullUser.firstname} ${fullUser.lastname}`,
            primary_contact_phone: fullUser.phone
        };

        const subaccountResp = await fetch("https://api.paystack.co/subaccount", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${paystackConfig.secret_key}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(subaccountPayload)
        });

        const subaccountData = await subaccountResp.json();
        
        if (!subaccountData.status) {
             throw new Error(subaccountData.message || "Failed to create Paystack Subaccount");
        }

        // 3. Update Store Record
        store.settlement_bank = bank_code;
        store.account_number = account_number;
        store.bank_name = bank_name || resolveData.data.bank_name || "Unknown Bank";
        store.paystack_subaccount_code = subaccountData.data.subaccount_code;
        store.paystack_subaccount_id = subaccountData.data.id.toString();

        await store.save();

        return res.status(200).json({
            success: true,
            message: "Vendor payout profile created successfully. You are now eligible to sell!",
            data: {
                account_name: accountName,
                subaccount_code: subaccountData.data.subaccount_code
            }
        });

    } catch (error: any) {
        console.error("Create Subaccount Error:", error);
        return res.status(500).json({ message: error.message || "Server Error" });
    }
};

/**
 * Get List of Banks
 */
export const GetBanks = async (req: Request, res: Response) => {
    try {
        const resp = await fetch("https://api.paystack.co/bank?currency=NGN", {
             headers: {
                Authorization: `Bearer ${paystackConfig.secret_key}`
            }
        });
        const data = await resp.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch banks" });
    }
};
