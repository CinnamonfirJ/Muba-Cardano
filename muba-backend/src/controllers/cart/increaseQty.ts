import { Request, Response } from "express";
import Cart from "../../models/cart.model";

export const increaseQty = async (req: Request, res: Response) => {
    // Route: /:_id/increase. Prefer params.
    const _id = req.params._id || req.body._id;

    try {
        if (!_id) {
            return res.status(400).json({ message: "Cart Item ID required" });
        }

        const item = await Cart.findByIdAndUpdate(
            _id,
            { $inc: { quantity: 1 } },
            { new: true }
        );
        
        if (!item) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        return res.status(200).json({
            message: "Product Quantity Successfully Increased",
            data: item
        });
    } catch (err) {
        console.log(`Internal Server Error: ${err}`);
        return res.status(500).json({ message: `Internal Server Error ${err}`});
    }
}