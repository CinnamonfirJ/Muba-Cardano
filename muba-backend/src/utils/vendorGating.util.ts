import Stores from "../models/stores.model.ts";
import { Types } from "mongoose";

/**
 * Returns an array of Store IDs that are eligible to sell.
 */
export const getEligibleStoreIds = async (): Promise<Types.ObjectId[]> => {
    const eligibleStores = await Stores.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        { $unwind: "$ownerDetails" },
        {
            $match: {
                paystack_subaccount_code: { $exists: true, $ne: "" },
                "ownerDetails.phone": { $exists: true, $ne: "" },
                "ownerDetails.matric_number": { $exists: true, $ne: "" }
            }
        },
        { $project: { _id: 1 } }
    ]);
    
    return eligibleStores.map(s => s._id);
};

/**
 * Checks if a specific store is payout ready.
 */
export const isStorePayoutReady = async (storeId: string): Promise<boolean> => {
    const store = await Stores.findById(storeId).populate("owner");
    if (!store) return false;

    const owner = store.owner as any;
    
    return !!(
        store.paystack_subaccount_code &&
        owner?.phone &&
        owner?.matric_number &&
        store.account_number &&
        store.settlement_bank
    );
};
