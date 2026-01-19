import express from "express";
import type { Request, Response } from "express";
import Stores from "../../models/stores.model.ts";
import Users from "../../models/users.model.ts"; // Import Users model

export const GetStores = async (req: Request, res: Response) => {
  try {
    const stores = await Stores.find()
      .populate({ path: "owner", select: "firstname email" })
      .populate({ path: "products" })
      .lean();

    return res.status(200).json({
      message: "Request Successful",
      data: stores,
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({ message: `Internal Server Error ${err}` });
  }
};

export const GetStore = async (req: Request, res: Response) => {
  const { _id } = req.params;

  try {
    const store = await Stores.findById(_id)
      .populate({ path: "owner", select: "firstname email" })
      .populate({ path: "products" })
      .lean();

    return res.status(200).json({
      message: "Request Successful",
      data: store,
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({ message: `Internal Server Error ${err}` });
  }
};

// Get all stores belonging to a specific user
export const GetUserStores = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    // Query stores directly by owner field
    const stores = await Stores.find({ owner: userId })
      .populate({ path: "owner", select: "firstname email" })
      .populate({ path: "products" })
      .lean();

    return res.status(200).json({
      message: "Request Successful",
      data: stores,
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({ message: `Internal Server Error ${err}` });
  }
};

// Get stores for the authenticated user
export const GetMyStores = async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const stores = await Stores.find({ owner: userId })
      .populate({ path: "owner", select: "firstname email" })
      .populate({ path: "products" })
      .lean();

    return res.status(200).json({
      message: "Request Successful",
      data: stores,
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({ message: `Internal Server Error ${err}` });
  }
};

// Get all stores followed by the authenticated user
export const GetFollowedStores = async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const stores = await Stores.find({ followers: userId })
      .populate({ path: "owner", select: "firstname email" })
      .populate({ path: "products" })
      .lean();

    return res.status(200).json({
      message: "Request Successful",
      data: stores,
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({ message: `Internal Server Error ${err}` });
  }
};
