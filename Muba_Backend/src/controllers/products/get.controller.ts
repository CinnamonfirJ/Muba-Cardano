import { Request, Response } from "express";
import Products from "../../models/products.model";

export const GetProducts = async (req: Request, res: Response) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      location,
      condition,
      sortBy,
      sortOrder,
      page = 1,
      limit = 20,
    } = req.query;

    // Build filter object
    const filter: any = {};

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    if (category) {
      filter.category = category;
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

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Sorting
    const sortOptions: any = {};
    if (sortBy) sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1;

    // Query database
    const products = await Products.find(filter)
      .populate({
        path: "store",
        populate: {
          path: "owner",
          select: "firstname lastname profile_img role rating",
        },
      })
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

  try {
    const products = await Products.findById(_id)
      .lean()
      .populate({
        path: "store",
        populate: {
          path: "owner",
          select: "firstname lastname profile_img role rating",
        },
      });
    if (!products) {
      return res.status(400).json({ message: "Product not found" });
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
      category,
      condition,
    } = req.query;

    // 🔹 Build query object
    const query: any = { store: storeId };

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Optional filters
    if (category) query.category = category;
    if (condition) query.condition = condition;

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 🔹 Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // 🔹 Sorting logic
    const sortOptions: any = {};
    if (sortBy) {
      sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1;
    } else {
      // Default: newest first
      sortOptions.createdAt = -1;
    }

    // 🔹 Query database
    const products = await Products.find(query)
      .populate("store", "name img")
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Products.countDocuments(query);

    // 🔹 Response
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
