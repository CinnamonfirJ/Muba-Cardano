import { Request, Response } from "express";
import Stores from "../../models/stores.model";

export const SearchStores = async (req: Request, res: Response) => {
  try {
    const { q, location } = req.query;
    const filter: any = {};

    if (q) {
      filter.name = { $regex: q, $options: "i" };
    }

    if (location) {
      filter.location = location;
    }

    const stores = await Stores.find(filter)
      .populate({ path: "owner", select: "firstname email" })
      .populate("products");

    res.status(200).json({ success: true, data: stores });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
