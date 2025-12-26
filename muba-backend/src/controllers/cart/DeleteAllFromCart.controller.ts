import { Request, Response } from "express";
import Cart from "../../models/cart.model";

export const DeleteAllFromCart = async (req: Request, res: Response) => {
  const { user_id } = req.body;

  try {
    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    // 🧹 Delete all cart items for the given user
    const result = await Cart.deleteMany({ user_id });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "No items found in cart to delete" });
    }

    return res.status(200).json({
      message: "All cart items successfully deleted",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error(`Internal Server Error (delete all): ${err}`);
    return res
      .status(500)
      .json({
        message: `Internal Server Error: ${
          err instanceof Error ? err.message : err
        }`,
      });
  }
};
