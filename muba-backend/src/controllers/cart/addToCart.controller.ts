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

        // Check for existing item with SAME variant
        const variantName = req.body.variant_details?.name;
        const query: any = { user_id, product_id: _id };
        
        if (variantName) {
             query["variant_details.name"] = variantName;
        } else {
             // For non-variant items, ensure we don't match a variant item
             query["variant_details"] = { $exists: false };
        }

        let cart = await Cart.findOne(query);

        if (cart) {
            // FIX: Accumulate quantity from request, or default to adding 1
            const qtyToAdd = (req.body.quantity && Number(req.body.quantity) > 0) 
                             ? Number(req.body.quantity) 
                             : 1;
            
            cart.quantity += qtyToAdd;
            // Update price in case it changed (e.g. flash sale or variant price update)
            if (req.body.price) cart.price = req.body.price;
            await cart.save();

            return res.status(200).json({
                message: "Product quantity increased in cart",
                data: cart,
            });
        }

        cart = await Cart.create({
            product_id: item._id,
            user_id,
            name: item.name || item.title,
            img: req.body.img ? [req.body.img] : (item.img?.length ? item.img : item.images), // Use sent image (variant) or default
            description: item.description,
            category: Array.isArray(item.category) ? item.category[0] : item.category,
            quantity: req.body.quantity || 1,
            price: req.body.price || item.price, // Use variant price if sent
            store: item.store,
            variant_details: req.body.variant_details
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
