import { NextFunction, Request, Response } from "express";
import Stores from "../models/stores.model";
import Products from "../models/products.model";
import Users from "../models/users.model";

export const VerifyProductOwner = async (req: Request, res: Response, next: NextFunction) => {
    const { _id } = req.params;
    const user = (req as any).user;

    try {
        if (!user || !user._id) {
            return res.status(403).json({ message: "No Logged In User, Please Login to Perform this action" });
        }

        const product = await Products.findById(_id).populate({
            path: "store",
            populate: {
                path: "owner",
                select: "_id"
            }
        });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        if (!product.store) {
            return res.status(403).json({ message: "Product Store not Found" });
        }
        if (!product.store.owner) {
            return res.status(403).json({ message: "Product Owner not Found" });
        }
        if (product.store.owner._id.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "You do not own this item, Only the seller can perform this action." });
        }
        
        next();
    } catch (err) {
        console.log(`Internal Server Error: ${err}`);
        return res.status(500).json({ message: `Internal Server Error ${err}`});
    }
}

export const VerifyStoreOwner = async (req: Request, res: Response, next: NextFunction) => {
    // Expect store ID in params (e.g., /stores/:id)
    // Note: The route param might be named 'id' or '_id' depending on route definition.
    // Based on previous files, it seems to be ':id' in edit controller but ':_id' in route file? 
    // Let's check route file in next logic steps. For now, try both or assume standard.
    // The previous edit controller used req.params.id. The route file used .route("/:_id").
    // Express params key matches the route definition string.
    
    const storeId = req.params._id || req.params.id; 
    const user = (req as any).user;

    if (!storeId) {
        return res.status(400).json({ message: "Store ID is missing" });
    }

    try {
        const store = await Stores.findById(storeId).populate({
            path: "owner",
            select: "_id"
        });

        if (!store) {
            return res.status(404).json({ message: "Store not Found" });
        }

        if (!user || store.owner._id.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "You do not own this Store, Only the seller can perform this action." });
        }
        
        next();
    } catch (err) {
        console.log(`Internal Server Error: ${err}`);
        return res.status(500).json({ message: `Internal Server Error ${err}`});
    }
}