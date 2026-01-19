import express from "express";
import type { Request, Response } from "express";
import Cart from "../../models/cart.model.ts";

export const GetUserCart = async (req: Request, res: Response) => {
    const { userId } = req.params;
    
    try {
        // Validate userId
        if (!userId) {
            return res.status(400).json({ 
                message: "User ID is required" 
            });
        }

        // Find all cart items for this user and populate related data
        const cartItems = await Cart.find({ user_id: userId })
            .populate({
                path: "store",
                select: "name verified owner img",
                populate: {
                    path: "owner",
                    select: "firstname lastname profile_img role rating"
                }
            })
            .lean()
            .sort({ createdAt: -1 }); // Most recent items first

        // If no items found, return empty cart (not an error)
        if (!cartItems || cartItems.length === 0) {
            return res.status(200).json({
                message: "Cart is empty",
                data: [],
                cart: [],
                itemCount: 0,
                subtotal: 0
            });
        }

        // Calculate cart totals
        const subtotal = cartItems.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);

        const itemCount = cartItems.reduce((sum, item) => {
            return sum + item.quantity;
        }, 0);

        return res.status(200).json({
            message: "Cart retrieved successfully",
            data: cartItems,
            cart: cartItems, // Include both for compatibility
            itemCount,
            subtotal,
            total: subtotal // Add taxes/shipping here if needed
        });

    } catch (err) {
        console.error(`Internal Server Error: ${err}`);
        return res.status(500).json({ 
            message: `Internal Server Error: ${err}` 
        });
    }
};


