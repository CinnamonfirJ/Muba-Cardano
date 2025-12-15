import { Request, Response } from "express";
import Products from "../../models/products.model";
import Stores from "../../models/stores.model";
import Users from "../../models/users.model";
import { uploadToCloudinary } from "../../middlewares/upload.middleware";
import mongoose from "mongoose";

export const EditProduct = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    const {
      title,
      description,
      price,
      originalPrice,
      category,
      condition,
      location,
      store,
      inStock,
      stockCount,
      brand,
      model,
      weight,
      dimensions,
      deliveryTime,
      warranty,
      sizes,
      colors,
      features,
      tags,
      specifications,
      existingImages,
      productType,
      variantType,
      variants,
      batchConfig
    } = req.body;

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Check if product exists
    const existingProduct = await Products.findById(_id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get uploaded image files (new images)
    const imageFiles = (req.files as any)?.images || [];

    // Parse JSON fields and validate them properly
    let storeId = _id;
    let categoryArray: string[] | undefined = undefined;
    let sizesArray: (string | number)[] = [];
    let colorsArray: string[] = [];
    let featuresArray: string[] = [];
    let tagsArray: string[] = [];
    let specificationsObj: { [key: string]: string } = {};
    let existingImagesArray: string[] = [];
    let variantsArray: any[] = [];
    let batchConfigObj: any = {};

    try {
      // Parse store ID (if being changed)
      if (store) {
        storeId = store;
        if (!mongoose.Types.ObjectId.isValid(storeId)) {
          throw new Error(`Invalid store ID: ${storeId}`);
        }

        // Verify store exists and user has permission
        const productStore = await Stores.findById(storeId).populate("owner");
        if (!productStore) {
          return res.status(400).json({ message: "Store does not exist" });
        }

        // Additional ownership verification would go here based on your auth middleware
      }

      // Parse categories if provided
      if (category) {
        categoryArray = JSON.parse(category);
        if (!Array.isArray(categoryArray) || categoryArray.length === 0) {
          return res.status(400).json({
            message: "At least one category is required",
          });
        }
      }

      // Parse existing images
      if (existingImages) {
        existingImagesArray = JSON.parse(existingImages);
        if (!Array.isArray(existingImagesArray)) {
          existingImagesArray = [];
        }
      }

      // Parse optional arrays
      if (sizes) sizesArray = JSON.parse(sizes);
      if (colors) colorsArray = JSON.parse(colors);
      if (features) featuresArray = JSON.parse(features);
      if (tags) tagsArray = JSON.parse(tags);
      if (specifications) specificationsObj = JSON.parse(specifications);

      // Parse New Fields
      if (variants) variantsArray = JSON.parse(variants);
      if (batchConfig) batchConfigObj = JSON.parse(batchConfig);

      console.log("Parsed store ID:", storeId);
      console.log("Parsed categories:", categoryArray);
      console.log("Existing images:", existingImagesArray);
      console.log("New images:", imageFiles.length);
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return res.status(400).json({
        message:
          parseError instanceof Error
            ? parseError.message
            : "Invalid JSON format for arrays or objects",
      });
    }

    // Upload new images to Cloudinary if any
    let newImageUrls: string[] = [];
    if (imageFiles.length > 0) {
      try {
        console.log(
          `Uploading ${imageFiles.length} new product images to Cloudinary...`
        );

        for (const imageFile of imageFiles) {
          const imageUrl = await uploadToCloudinary(
            imageFile.buffer,
            "product-images"
          );
          newImageUrls.push(imageUrl);
        }

        console.log("New product images uploaded successfully:", newImageUrls);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          message: "Failed to upload new product images to cloud storage",
          error:
            uploadError instanceof Error
              ? uploadError.message
              : "Upload failed",
        });
      }
    }

    // Combine existing and new images
    const allImages = [...existingImagesArray, ...newImageUrls];

    // Ensure at least one image exists
    if (allImages.length === 0) {
      return res.status(400).json({
        message: "At least one product image is required",
      });
    }

    // Build update object with only provided fields
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (originalPrice !== undefined) {
      updateData.originalPrice = originalPrice
        ? parseFloat(originalPrice)
        : undefined;
    }
    if (condition !== undefined) updateData.condition = condition;
    if (location !== undefined) updateData.location = location;
    if (store !== undefined && storeId) updateData.store = storeId;
    if (inStock !== undefined) updateData.inStock = inStock === "true";
    if (stockCount !== undefined) {
      updateData.stockCount = stockCount ? parseInt(stockCount) : undefined;
    }

    // Optional fields
    if (brand !== undefined) updateData.brand = brand || undefined;
    if (model !== undefined) updateData.model = model || undefined;
    if (weight !== undefined) updateData.weight = weight || undefined;
    if (dimensions !== undefined)
      updateData.dimensions = dimensions || undefined;
    if (deliveryTime !== undefined)
      updateData.deliveryTime = deliveryTime || undefined;
    if (warranty !== undefined) updateData.warranty = warranty || undefined;

    // Arrays
    updateData.images = allImages;
    if (category !== undefined && categoryArray)
      updateData.category = categoryArray;
    if (sizes !== undefined)
      updateData.sizes = sizesArray.length > 0 ? sizesArray : undefined;
    if (colors !== undefined)
      updateData.colors = colorsArray.length > 0 ? colorsArray : undefined;
    if (features !== undefined)
      updateData.features =
        featuresArray.length > 0 ? featuresArray : undefined;
    if (tags !== undefined)
      updateData.tags = tagsArray.length > 0 ? tagsArray : undefined;
    if (specifications !== undefined) {
      updateData.specifications =
        Object.keys(specificationsObj).length > 0
          ? specificationsObj
          : undefined;
    }
    
    // New Fields
    if (productType !== undefined) updateData.productType = productType;
    if (variantType !== undefined) updateData.variantType = variantType;
    if (variants !== undefined) updateData.variants = variantsArray.length > 0 ? variantsArray : undefined;
    if (batchConfig !== undefined) updateData.batchConfig = Object.keys(batchConfigObj).length > 0 ? batchConfigObj : undefined;

    // Update the product
    const updatedProduct = await Products.findByIdAndUpdate(_id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate({
        path: "seller",
        select: "firstname lastname campus rating totalSales responseTime",
      })
      .populate({
        path: "store",
        select: "name logo verified",
      });

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ message: "Product not found after update" });
    }

    // If store was changed, update both old and new stores
    if (store && storeId && existingProduct.store.toString() !== storeId) {
      try {
        // Remove from old store
        await Stores.findByIdAndUpdate(
          existingProduct.store,
          { $pull: { products: _id } },
          { runValidators: true }
        );

        // Add to new store
        await Stores.findByIdAndUpdate(
          storeId,
          { $addToSet: { products: _id } },
          { runValidators: true }
        );

        console.log("Store references updated successfully");
      } catch (storeUpdateError) {
        console.error("Error updating store references:", storeUpdateError);
        console.warn("Product updated but failed to update store references");
      }
    }

    return res.status(200).json({
      message: "Product successfully updated",
      data: updatedProduct,
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
