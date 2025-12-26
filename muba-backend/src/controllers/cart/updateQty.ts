import { Request, Response } from "express";
import Cart from "../../models/cart.model";

export const updateQty = async (req: Request, res: Response) => {
    const { _id, quantity } = req.body;

    try {
        if (!_id) {
            return res.status(400).json({ message: "Cart Item ID required" });
        }

        if (quantity === undefined || quantity === null || quantity < 0) {
            return res.status(400).json({ message: "Valid quantity required (>= 0)" });
        }

        // If quantity is 0, we could remove it, but let the reducer handle it or just update it.
        // User requested reworking increase/decrease, so a direct SET is best.
        
        const item = await Cart.findByIdAndUpdate(
            _id,
            { $set: { quantity: quantity } },
            { new: true }
        );
        
        if (!item) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        return res.status(200).json({
            message: "Product Quantity Successfully Updated",
            data: item
        });
    } catch (err) {
        console.error(`Internal Server Error: ${err}`);
        return res.status(500).json({ message: `Internal Server Error ${err}`});
    }
}
