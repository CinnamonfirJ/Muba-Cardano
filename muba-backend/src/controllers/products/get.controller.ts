import express from "express";
import type { Request, Response } from "express";
import Products from "../../models/products.model.ts";
import type { ProductTypes } from "../../dto/products.dto.ts";
import { getEligibleStoreIds } from "../../utils/vendorGating.util.ts";

export const GetProducts = async (req: Request, res: Response) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      rating,
      location,
      condition,
      sortBy,
      sortOrder,
      page = 1,
      limit = 20,
    } = req.query;

    // Build filter object with Marketplace Gating
    const eligibleStoreIds = await getEligibleStoreIds();
    const filter: any = { store: { $in: eligibleStoreIds } };

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    if (category) {
      filter.category = { $regex: new RegExp(`^${category}$`, "i") };
    }

    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    if (condition) {
      filter.condition = condition;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (rating) {
      filter.rating = { $gte: Number(rating) };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Sorting
    const sortOptions: any = {};
    if (sortBy) sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1;

    // 🔹 Personalized Recommendation Logic
    let recommendedCategory: string[] = [];
    const user = (req as any).user;
    if (user && !category) {
       const Interactions = (await import("../../models/interactions.model.ts")).default;
       const topInteractions = await Interactions.aggregate([
          { $match: { userId: user._id } },
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 3 }
       ]);
       recommendedCategory = topInteractions.map((ti: any) => ti._id);
    }

    // Biasing query
    if (recommendedCategory.length > 0) {
       // ... recommended logic
    }

    // Query database
    let productsQuery = Products.find(filter)
      .populate({
        path: "store",
        populate: {
          path: "owner",
          select: "firstname lastname profile_img role rating phone matric_number",
        },
      });

    const products = await productsQuery
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Products.countDocuments(filter);

    return res.status(200).json({
      message: "Request Successful",
      products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        hasMore: skip + products.length < total,
      },
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({ message: `Internal Server Error ${err}` });
  }
};

export const GetProduct = async (req: Request, res: Response) => {
  const { _id } = req.params;
  const user = (req as any).user;

  try {
    const products = (await Products.findById(_id)
      .lean()
      .populate({
        path: "store",
        populate: {
          path: "owner",
          select: "firstname lastname profile_img role rating phone matric_number",
        },
      })) as unknown as ProductTypes | null;
    
    if (!products) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 🎯 Marketplace Gating: Verify store is ready
    const storeObj = products.store as any;
    const ownerObj = storeObj?.owner as any;
    if (!storeObj?.paystack_subaccount_code || !ownerObj?.phone || !ownerObj?.matric_number) {
        return res.status(403).json({ 
            message: "This vendor is temporarily unavailable. Payout profile pending setup." 
        });
    }

    // Log view interaction if user is logged in
    if (user && products) {
      const Interactions = (await import("../../models/interactions.model.ts"))
        .default;
      Interactions.create({
        userId: user._id,
        productId: products?._id,
        interactionType: "view",
        category: products?.category[0] || "Uncategorized",
      }).catch((err: any) => console.error("Error logging interaction:", err));
    }

    return res.status(200).json({
      message: "Request Successfull",
      data: products,
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({ message: `Internal Server Error ${err}` });
  }
};

export const GetProductsByStore = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const {
      search,
      page = 1,
      limit = 50,
      sortBy,
      sortOrder,
      minPrice,
      maxPrice,
      rating,
      category,
      condition,
    } = req.query;

    const query: any = { store: storeId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category) query.category = category;
    if (condition) query.condition = condition;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions: any = {};
    if (sortBy) {
      sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const products = await Products.find(query)
      .populate("store", "name img")
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Products.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
        hasMore: skip + products.length < total,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in GetProductsByStore:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch store products",
    });
  }
};

export const GetFeaturedProducts = async (req: Request, res: Response) => {
  try {
    const eligibleStoreIds = await getEligibleStoreIds();
    const gatingFilter = { store: { $in: eligibleStoreIds } };

    const promotedProducts = await Products.find({
      ...gatingFilter,
      featuredSlot: { $exists: true, $ne: null },
      featuredUntil: { $gt: new Date() }
    })
    .populate("store", "name img")
    .sort({ featuredSlot: 1 })
    .limit(5)
    .lean();

    const promotedIds = promotedProducts.map((p: any) => p._id.toString());
    const slotsFilled = promotedProducts.length;

    let fillerProducts: any[] = [];
    if (slotsFilled < 5) {
      fillerProducts = await Products.find({
        ...gatingFilter,
        _id: { $nin: promotedIds }
      })
      .populate("store", "name img")
      .sort({ rating: -1, createdAt: -1 })
      .limit(5 - slotsFilled)
      .lean();
    }

    const result = new Array(5).fill(null);
    promotedProducts.forEach((p: any) => {
      if (p.featuredSlot && p.featuredSlot >= 1 && p.featuredSlot <= 5) {
        result[p.featuredSlot - 1] = p;
      }
    });

    let fillerIdx = 0;
    for (let i = 0; i < 5; i++) {
       if (result[i] === null && fillerIdx < fillerProducts.length) {
          result[i] = fillerProducts[fillerIdx++];
       }
    }

    const finalProducts = result.filter(p => p !== null);

    return res.status(200).json({
      success: true,
      data: finalProducts
    });
  } catch (error: any) {
    console.error("GetFeaturedProducts Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
