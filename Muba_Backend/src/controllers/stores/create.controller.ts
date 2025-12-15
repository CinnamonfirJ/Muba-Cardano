import { Request, Response } from "express";
import Stores from "../../models/stores.model";
import Users from "../../models/users.model";
import { uploadToCloudinary } from "../../middlewares/upload.middleware";
import mongoose from "mongoose";

export const CreateStore = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      location,
      owner,
      categories,
      // shippingPolicy,
      // returnPolicy,
      // warranty,
    } = req.body;

    // Get uploaded image file
    const imgFile = (req.files as any)?.img?.[0];

    // Parse JSON fields and validate them properly
    let ownerId: string;
    let categoriesArray: string[];

    try {
      ownerId = owner;
      if (!ownerId) {
        return res.status(400).json({ message: "Owner must be provided" });
      }

      // Parse categories
      categoriesArray = JSON.parse(categories);
      if (!Array.isArray(categoriesArray)) {
        return res.status(400).json({
          message: "Categories must be an array",
        });
      }

      console.log("Parsed owner ID:", ownerId);
      console.log("Parsed categories array:", categoriesArray);

      // Validate owner ObjectId
      if (!mongoose.Types.ObjectId.isValid(ownerId)) {
        throw new Error(`Invalid owner ID: ${ownerId}`);
      }
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return res.status(400).json({
        message:
          parseError instanceof Error
            ? parseError.message
            : "Invalid JSON format for owner or categories",
        received: { owner, categories },
      });
    }

    // Validation
    if (!name || !imgFile || !description || !location || !ownerId) {
      return res.status(400).json({ message: "All Input is Required" });
    }

    // Check if store already exists
    const storeExists = await Stores.findOne({ name });
    if (storeExists) {
      return res.status(400).json({ message: "Store already exists" });
    }

    // Verify that the owner ID exists in Users collection
    const ownerUser = await Users.findById(ownerId);
    if (!ownerUser) {
      return res.status(400).json({
        message: "Owner user does not exist",
      });
    }

    // Upload image to Cloudinary
    let imgUrl: string;
    try {
      console.log("Uploading store image to Cloudinary...");
      imgUrl = await uploadToCloudinary(imgFile.buffer, "store-images");
      console.log("Store image uploaded successfully:", imgUrl);
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      return res.status(500).json({
        message: "Failed to upload store image to cloud storage",
        error:
          uploadError instanceof Error ? uploadError.message : "Upload failed",
      });
    }

    // Create new store
    const newStore = await Stores.create({
      name,
      img: imgUrl,
      description,
      location,
      owner: ownerId, // Single owner ObjectId
      categories: categoriesArray,
      // shippingPolicy: shippingPolicy || "",
      // returnPolicy: returnPolicy || "",
      // warranty: warranty || "",
    });

    // Populate owner information
    const store = await Stores.findById(newStore._id).populate({
      path: "owner",
      select: "firstname email",
    });

    // Update user with store reference
    try {
      console.log("Updating user with store reference...");
      console.log("Owner ID for user update:", ownerId);

      const userUpdateResult = await Users.findByIdAndUpdate(
        ownerId,
        { $push: { stores: newStore._id } },
        { new: true, runValidators: true }
      );

      console.log(
        "User update result:",
        userUpdateResult ? "Success" : "Failed"
      );
    } catch (userUpdateError) {
      console.error("Error updating user:", userUpdateError);
      // Store was created successfully, but user update failed
      // This is not critical, so we can still return success
      console.warn("Store created but failed to update user reference");
    }

    return res.status(201).json({
      message: "Your Store has been Created",
      data: store,
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({
      message: `Internal Server Error: ${
        err instanceof Error ? err.message : "Unknown error"
      }`,
    });
  }
};
