import { Request, Response } from "express";
import Cart from "../../models/cart.model";
import Products from "../../models/products.model";

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
            cart.quantity += 1;
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
            quantity: 1,
            price: item.price,
            store: item.store,
        });

        return res.status(201).json({
            message: "Product Successfully Added",
            data: cart
        });
    } catch (err) {
        console.log(`Internal Server Error: ${err}`);
        return res.status(500).json({ message: `Internal Server Error ${err}`});
    }
}