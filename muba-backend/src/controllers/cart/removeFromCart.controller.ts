import { Request, Response } from "express";
import Cart from "../../models/cart.model";

export const RemoveFromCart = async (req: Request, res: Response) => {
    const { _id } = req.body;

    try {
        if (!_id) {
            return res.status(401).json({ message: "All Input are required" });
        }

        await Cart.findByIdAndDelete(_id);

        return res.status(200).json({
            message: "Product Successfully Removed"
        });
    } catch (err) {
        console.log(`Internal Server Error: ${err}`);
        return res.status(500).json({ message: `Internal Server Error ${err}`});
    }
}