import express from "express";
import type { Request, Response } from "express";
import Products from "../../models/products.model.ts";
import { getEligibleStoreIds } from "../../utils/vendorGating.util.ts";

export const SearchProducts = async (req: Request, res: Response) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;

    // Build filter object with Marketplace Gating
    const eligibleStoreIds = await getEligibleStoreIds();
    const filter: any = { store: { $in: eligibleStoreIds } };

    if (q) {
      const searchQuery =
        typeof q === "string" ? q : Array.isArray(q) ? q.join(" ") : ""; 

      const words = searchQuery.split(" ").filter(Boolean);

      filter.$and = [
        ...words.map((word: string) => {
            const regex = { $regex: word, $options: "i" };
            return {
              $or: [
                { name: regex },
                { description: regex },
                { category: regex },
                { colors: regex },
              ],
            };
        })
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const products = await Products.find(filter).populate("store");

    res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
