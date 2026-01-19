import express from "express";
import type { Request, Response } from "express";
import Cart from "../../models/cart.model.ts";
import Products from "../../models/products.model.ts";

export const AddToCart = async (req: Request, res: Response) => {
    const { _id, user_id } = req.body;

    try {
        if (!_id) {
            return res.status(400).json({ message: "All Input are required" });
        }

        const item = await Products.findById(_id)
        if (!item) {
            return res.status(404).json({ message: "Product not found" });
        }

        let cart = await Cart.findOne({ user_id, product_id: _id });
        if (cart) {
            // FIX: Accumulate quantity from request, or default to adding 1
            const qtyToAdd = (req.body.quantity && Number(req.body.quantity) > 0) 
                             ? Number(req.body.quantity) 
                             : 1;
            
            cart.quantity += qtyToAdd;
            await cart.save();

            return res.status(200).json({
                message: "Product quantity increased in cart",
                data: cart,
            });
        }

        cart = await Cart.create({
            product_id: item._id,
            user_id,
            name: item.name || item.title, // fallback for missing field
            img: item.img?.length ? item.img[0] : item.images[0],
            description: item.description,
            category: Array.isArray(item.category) ? item.category[0] : item.category, // convert to string
            quantity: 1, // Default to 1 on create, logic below handles update if needed or passed
            price: item.price,
            store: item.store,
        });

        // If quantity passed in body, set it
        if (req.body.quantity && req.body.quantity > 1) {
             cart.quantity = req.body.quantity;
             await cart.save();
        }

        return res.status(201).json({
            message: "Product Successfully Added",
            data: cart
        });
    } catch (err) {
        console.log(`Internal Server Error: ${err}`);
        return res.status(500).json({ message: `Internal Server Error ${err}`});
    }
}
