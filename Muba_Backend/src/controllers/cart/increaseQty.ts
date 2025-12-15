import { Request, Response } from "express";
import Cart from "../../models/cart.model";

export const increaseQty = async (req: Request, res: Response) => {
    const { _id } = req.body;

    try {
        if (!_id) {
            return res.status(400).json({ message: "All Input are required" });
        }

        const item = await Cart.findByIdAndUpdate(
            _id,
            { $inc: { quantity: 1 } },
            { new: true }
        );
        
        if (!item) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        return res.status(201).json({
            message: "Product Quantity Successfully Increased",
            data: item
        });
    } catch (err) {
        console.log(`Internal Server Error: ${err}`);
        return res.status(500).json({ message: `Internal Server Error ${err}`});
    }
}