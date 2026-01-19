import express from "express";
import type { Request, Response } from "express";
import Stores from "../../models/stores.model.ts";
import Users from "../../models/users.model.ts";
import { uploadToCloudinary } from "../../middlewares/upload.middleware.ts";
import mongoose from "mongoose";
import { isValidMatricNumber } from "../../utils/validation.util.ts";

export const EditStoreDetails = async (req: Request, res: Response) => {
  try {
    const { _id: id } = req.params; // store id from URL maps to 'id' variable

    const {
      name,
      description,
      location,
      categories,
      owner,
      // shippingPolicy,
      // returnPolicy,
      // warranty,
      existingImg,
      settlement_bank,
      account_number,
      matric_number
    } = req.body;

    console.log("Edit store request body:", req.body);
    console.log("Edit store files:", req.files);

    // Validate store ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid store ID" });
    }

    // Get uploaded image file (if any)
    const imgFile = (req.files as any)?.img?.[0];

    // Parse owner & categories
    let ownerId: string;
    let categoriesArray: string[] = [];

    try {
      ownerId = owner;
      if (!ownerId) {
        return res.status(400).json({ message: "Owner must be provided" });
      }

      if (!mongoose.Types.ObjectId.isValid(ownerId)) {
        return res
          .status(400)
          .json({ message: `Invalid owner ID: ${ownerId}` });
      }

      if (categories) {
        categoriesArray =
          typeof categories === "string" ? JSON.parse(categories) : categories;

        if (!Array.isArray(categoriesArray)) {
          return res
            .status(400)
            .json({ message: "Categories must be an array" });
        }
      }
    } catch (parseError) {
      console.error("Parsing error:", parseError);
      return res.status(400).json({
        message:
          parseError instanceof Error
            ? parseError.message
            : "Invalid JSON format for owner or categories",
        received: { owner, categories },
      });
    }

    // Check if store exists
    const existingStore = await Stores.findById(id).populate({
      path: "owner",
      select: "firstname email id",
    });

    if (!existingStore) {
      return res.status(404).json({ message: "Store not found" });
    }

    // Verify that the owner exists
    const ownerUser = await Users.findById(ownerId);
    if (!ownerUser) {
      return res.status(400).json({ message: "Owner user does not exist" });
    }

    // Handle image
    let imgUrl = existingStore.img;
    if (imgFile) {
      try {
        console.log("Uploading new store image to Cloudinary...");
        imgUrl = await uploadToCloudinary(imgFile.buffer, "store-images");
        console.log("Store image updated:", imgUrl);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          message: "Failed to upload store image",
          error:
            uploadError instanceof Error
              ? uploadError.message
              : "Upload failed",
        });
      }
    } else if (existingImg && existingImg !== existingStore.img) {
      imgUrl = existingImg;
    }

    // Prepare update data
    const updateData: any = { lastActive: new Date() };

    if (name && name.trim()) {
      if (name !== existingStore.name) {
        const nameExists = await Stores.findOne({
          name: name.trim(),
          _id: { $ne: id },
        });
        if (nameExists) {
          return res.status(400).json({ message: "Store name already exists" });
        }
      }
      updateData.name = name.trim();
    }

    if (description && description.trim())
      updateData.description = description.trim();
    if (location && location.trim()) updateData.location = location.trim();
    if (imgUrl && imgUrl !== existingStore.img) updateData.img = imgUrl;
    if (categoriesArray && categoriesArray.length > 0)
      updateData.categories = categoriesArray;
    if (ownerId && ownerId !== existingStore.owner.toString())
      updateData.owner = ownerId;

    if (settlement_bank) updateData.settlement_bank = settlement_bank;
    if (account_number) updateData.account_number = account_number;

    // Handle Matric Number Update for Owner
    if (matric_number) {
        if (!isValidMatricNumber(matric_number)) {
            return res.status(400).json({ message: "Invalid Matriculation Number format." });
        }
        await Users.findByIdAndUpdate(ownerId, { matric_number: matric_number.toUpperCase() });
    }

    // if (shippingPolicy !== undefined) updateData.shippingPolicy = shippingPolicy.trim();
    // if (returnPolicy !== undefined) updateData.returnPolicy = returnPolicy.trim();
    // if (warranty !== undefined) updateData.warranty = warranty.trim();

    console.log("Update data:", updateData);

    // Update store
    const updatedStore = await Stores.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate({
      path: "owner",
      select: "firstname email id",
    });

    if (!updatedStore) {
      return res.status(404).json({ message: "Store not found after update" });
    }

    // Update user's store reference if owner changed
    if (ownerId && ownerId !== existingStore.owner.toString()) {
      try {
        await Users.findByIdAndUpdate(ownerId, {
          $addToSet: { stores: updatedStore.id },
        });

        await Users.findByIdAndUpdate((existingStore.owner as any)._id, {
          $pull: { stores: updatedStore.id },
        });
      } catch (userUpdateError) {
        console.error("Error updating user store references:", userUpdateError);
        console.warn("Store updated but user references may be inconsistent");
      }
    }

    console.log("Store updated successfully:", updatedStore.name);

    return res.status(200).json({
      message: "Your Store Information has been updated",
      data: updatedStore,
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    console.log("Route params:", req.params);
    console.error("Store ID length:", req.params.id.length);
    return res.status(500).json({
      message: `Internal Server Error: ${
        err instanceof Error ? err.message : "Unknown error"
      }`,
    });
  }
};



