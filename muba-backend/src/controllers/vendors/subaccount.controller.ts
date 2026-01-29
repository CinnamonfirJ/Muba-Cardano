import type { Request, Response } from "express";
import { paystackConfig } from "../../../config/index.ts";
import Stores from "../../models/stores.model.ts";
import Users from "../../models/users.model.ts";

/**
 * Creates or Updates a Paystack Subaccount
 * Docs: https://paystack.com/docs/api/subaccount/#create
 */
/**
 * Creates or Updates a Paystack Subaccount
 * Docs: https://paystack.com/docs/api/subaccount/#create
 * Docs: https://paystack.com/docs/api/subaccount/#update
 */
export const CreateSubaccount = async (req: Request, res: Response) => {
    const { 
        storeId, 
        account_number, 
        bank_code,
        bank_name,
        business_name,
        description
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

        // 2. Prepare Payload
         const subaccountPayload = {
            business_name: business_name || `${store.name} (${accountName})`,
            settlement_bank: bank_code,
            account_number: account_number,
            percentage_charge: 0, // Platform fees handled manually via Split API
            description: description || `Payout account for ${store.name}`,
            primary_contact_email: fullUser.email,
            primary_contact_name: `${fullUser.firstname} ${fullUser.lastname}`,
            primary_contact_phone: fullUser.phone
        };

        let subaccountData;
        
        // 3. Create or Update Logic
        if (store.paystack_subaccount_code) {
             // UPDATE Existing Subaccount (PUT)
             const updateResp = await fetch(`https://api.paystack.co/subaccount/${store.paystack_subaccount_code}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${paystackConfig.secret_key}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(subaccountPayload)
            });
            subaccountData = await updateResp.json();
             if (!subaccountData.status) {
                 throw new Error(subaccountData.message || "Failed to update Paystack Subaccount");
            }
        } else {
            // CREATE New Subaccount (POST)
            const createResp = await fetch("https://api.paystack.co/subaccount", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${paystackConfig.secret_key}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(subaccountPayload)
            });
            subaccountData = await createResp.json();
            if (!subaccountData.status) {
                throw new Error(subaccountData.message || "Failed to create Paystack Subaccount");
           }
        }

        // 4. Update Store Record
        store.settlement_bank = bank_code;
        store.account_number = account_number;
        store.bank_name = bank_name || resolveData.data.bank_name || "Unknown Bank";
        store.paystack_subaccount_code = subaccountData.data.subaccount_code;
        // Some responses might not return ID on update, rely on code or existing ID
        if (subaccountData.data.id) {
            store.paystack_subaccount_id = subaccountData.data.id.toString();
        }

        // RESET verification status on bank change/update?
        // Usually modifying bank details requires re-verification.
        // Paystack might set is_verified: false automatically.
        // We update our local status based on response.
        if (subaccountData.data.is_verified === true) {
             store.payout_ready = true;
        } else {
             store.payout_ready = false;
        }
        
        // Active status
        if (subaccountData.data.active === false) {
             store.payout_ready = false; // Safety check
        }

        await store.save();

        return res.status(200).json({
            success: true,
            message: store.paystack_subaccount_code ? "Payout details updated successfully." : "Payout account created successfully.",
            data: {
                account_name: accountName,
                subaccount_code: subaccountData.data.subaccount_code,
                is_verified: subaccountData.data.is_verified,
                active: subaccountData.data.active
            }
        });

    } catch (error: any) {
        console.error("Subaccount Error:", error);
        return res.status(500).json({ message: error.message || "Server Error" });
    }
};

/**
 * Deactivate a Subaccount
 * PUT /subaccount/:code with active=false
 */
export const DeactivateSubaccount = async (req: Request, res: Response) => {
    const { storeId } = req.body;
    const user = (req as any).user;

    try {
        const store = await Stores.findOne({ _id: storeId, owner: user._id });
        if (!store || !store.paystack_subaccount_code) {
             return res.status(404).json({ message: "Store or subaccount not found" });
        }

        const deactivatePayload = { active: false };

        const updateResp = await fetch(`https://api.paystack.co/subaccount/${store.paystack_subaccount_code}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${paystackConfig.secret_key}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(deactivatePayload)
        });

        const subaccountData = await updateResp.json();
        
        if (!subaccountData.status) {
             throw new Error(subaccountData.message || "Failed to deactivate subaccount");
        }

        // Update local state
        store.payout_ready = false;
        // Optionally clear subaccount code if "deletion" means removal? 
        // User asked for "Deletion Request". Deactivation is safer.
        // If they want to "remove" it, maybe clear the fields?
        // For now, adhere to "active: false" as per API capability.
        
        await store.save();

        return res.status(200).json({
            success: true,
            message: "Payout account deactivated successfully."
        });

    } catch (error: any) {
         console.error("Deactivate Subaccount Error:", error);
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
