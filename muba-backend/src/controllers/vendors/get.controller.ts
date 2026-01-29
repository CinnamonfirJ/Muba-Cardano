import express from "express";
import type { Request, Response } from "express";
import Users from "../../models/users.model.ts";
import Stores from "../../models/stores.model.ts";
import { syncPaystackVerification } from "../../utils/paystackVerification.util.ts";

export const GetVendors = async (req: Request, res: Response) => {
    try {
        const vendors = await Users.find({ role: "vendor" })
                                    .populate({
                                        path: "stores"
                                    })
                                    .lean();

        return res.status(200).json({
            message: "Request Successfull",
            data: vendors  // this would return [] because there's no vendor in the database
        });
    } catch (err) {
        console.error(`Internal Server Error: ${err}`);
        return res.status(500).json({ message: `Internal Server Error ${err}`});
    }
}

export const GetVendor = async (req: Request, res: Response) => {
    const { _id } = req.params;
    const currentUser = (req as any).user;
    
    try {
        const vendor = await Users.findById(_id)
                                    .populate({ path: "stores" });
        
        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        // 🎯 Auto-Sync Verification if owner is viewing
        if (currentUser && currentUser._id.toString() === _id) {
            // Find user's store and sync
            const store = await Stores.findOne({ owner: _id });
            if (store && store.verification_requested && !store.payout_ready) {
                await syncPaystackVerification(store);
            }
        }

        return res.status(200).json({
            message: "Request Successfull",
            data: vendor
        });
    } catch (err) {
        console.error(`Internal Server Error: ${err}`);
        return res.status(500).json({ message: `Internal Server Error ${err}`});
    }
}


