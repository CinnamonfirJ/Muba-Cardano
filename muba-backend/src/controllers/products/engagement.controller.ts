import express from "express";
import type { Request, Response, RequestHandler } from "express";
import Users from "../../models/users.model.ts";
import Products from "../../models/products.model.ts";

/**
 * Toggle Like/Favorite for a product
 */
export const ToggleLikeProduct: RequestHandler = async (req: any, res: any) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const product = await Products.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const favorites = user.favorites || [];
        const isLiked = favorites.some((id: any) => id.toString() === productId);

        if (isLiked) {
            // Unlike
            await Users.findByIdAndUpdate(userId, {
                $pull: { favorites: productId }
            });
            await Products.findByIdAndUpdate(productId, {
                $inc: { likes: -1 }
            });
            return res.status(200).json({ message: "Removed from favorites", liked: false });
        } else {
            // Like
            await Users.findByIdAndUpdate(userId, {
                $addToSet: { favorites: productId }
            });
            await Products.findByIdAndUpdate(productId, {
                $inc: { likes: 1 }
            });

            // Log like interaction
            const Interactions = (await import("../../models/interactions.model")).default;
            Interactions.create({
                userId: userId,
                productId: product._id,
                interactionType: "like",
                category: Array.isArray(product.category) ? product.category[0] : (product.category as any)
            }).catch(err => console.error("Error logging like interaction:", err));

            return res.status(200).json({ message: "Added to favorites", liked: true });
        }

    } catch (error: any) {
        console.error("Toggle Like Error:", error);
        return res.status(500).json({ message: error.message || "Failed to toggle like" });
    }
};

/**
 * Get User's Favorite Products
 */
export const GetUserFavorites: RequestHandler = async (req: any, res: any) => {
    try {
        const userId = req.user._id;

        const user = await Users.findById(userId).populate({
            path: "favorites",
            populate: [
                { path: "store", select: "name" },
                { path: "seller", select: "firstname lastname" }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            message: "Favorites fetched successfully",
            data: user.favorites || []
        });

    } catch (error: any) {
        console.error("Get Favorites Error:", error);
        return res.status(500).json({ message: error.message || "Failed to fetch favorites" });
    }
};



