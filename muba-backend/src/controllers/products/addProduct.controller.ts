import express from "express";
import type { Request, Response } from "express";
import Products from "../../models/products.model.ts";
import Stores from "../../models/stores.model.ts";
import Users from "../../models/users.model.ts";
import { uploadToCloudinary } from "../../middlewares/upload.middleware.ts";
import mongoose from "mongoose";

export const AddProduct = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      price,
      originalPrice,
      category,
      condition,
      // location, // Inherited from store
      seller,
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
      productType,
      variantType,
      variants,
      batchConfig
    } = req.body;

    // Get uploaded image files
    const imageFiles = (req.files as Express.Multer.File[]) || [];

    // Parse JSON fields and validate them properly
    let sellerId: string;
    let storeId: string;
    let categoryArray: string[];
    let sizesArray: (string | number)[] = [];
    let colorsArray: string[] = [];
    let featuresArray: string[] = [];
    let tagsArray: string[] = [];
    let specificationsObj: { [key: string]: string } = {};
    let variantsArray: any[] = [];
    let batchConfigObj: any = {};

    try {
      // Parse seller ID
      sellerId = seller;
      if (!sellerId) {
        return res.status(400).json({ message: "Seller must be provided" });
      }

      // Parse store ID
      storeId = store;
      if (!storeId) {
        return res.status(400).json({ message: "Store must be provided" });
      }

      // Parse categories (required)
      categoryArray = JSON.parse(category);
      if (!Array.isArray(categoryArray) || categoryArray.length === 0) {
        return res.status(400).json({
          message: "At least one category is required",
        });
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

      // Validate ObjectIds
      if (!mongoose.Types.ObjectId.isValid(sellerId)) {
        throw new Error(`Invalid seller ID: ${sellerId}`);
      }
      if (!mongoose.Types.ObjectId.isValid(storeId)) {
        throw new Error(`Invalid store ID: ${storeId}`);
      }
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return res.status(400).json({
        message:
          parseError instanceof Error
            ? parseError.message
            : "Invalid JSON format for arrays or objects",
        received: {
          seller,
          store,
          category,
          sizes,
          colors,
          features,
          tags,
          specifications,
        },
      });
    }

    // Verify that the store exists and get location
    const productStore = await Stores.findById(storeId).populate("owner");
    if (!productStore) {
      return res.status(400).json({
        message: "Store does not exist",
      });
    }

    const location = productStore.location || "Online";

    // Validation - Required fields
    if (
      !title ||
      !description ||
      !price ||
      !condition ||
      // !location || // Inherited
      !sellerId ||
      !storeId ||
      imageFiles.length === 0
    ) {
      return res.status(400).json({
        message:
          "Title, description, price, condition, seller, store, and at least one image are required",
      });
    }

    // Verify that the seller exists
    const sellerUser = await Users.findById(sellerId);
    if (!sellerUser) {
      return res.status(400).json({
        message: "Seller user does not exist",
      });
    }

    // Check if seller owns the store
    const storeOwnerId =
      typeof productStore.owner === "object" && productStore.owner
        ? productStore.owner._id
        : productStore.owner;
    if (storeOwnerId.toString() !== sellerId.toString()) {
      return res.status(403).json({
        message: "You can only add products to your own stores",
      });
    }

    // Upload images to Cloudinary
    let imageUrls: string[] = [];
    try {
      // ... upload logic ...
      console.log(
        `Uploading ${imageFiles.length} product images to Cloudinary...`
      );

      for (const imageFile of imageFiles) {
        const imageUrl = await uploadToCloudinary(
          imageFile.buffer,
          "product-images"
        );
        imageUrls.push(imageUrl);
      }
    } catch (uploadError) {
       // ... error handling
       console.error("Cloudinary upload error:", uploadError);
       return res.status(500).json({ message: "Failed to upload images" });
    }

    // Create new product
    const newProduct = await Products.create({
      title,
      description,
      productType: productType || "single",
      variantType: variantType || "None",
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      images: imageUrls,
      category: categoryArray,
      condition,
      location,
      seller: sellerId,
      store: storeId,
      inStock: inStock !== undefined ? inStock === "true" : true,
      stockCount: stockCount ? parseInt(stockCount) : undefined,
      brand: brand || undefined,
      model: model || undefined,
      weight: weight || undefined,
      dimensions: dimensions || undefined,
      deliveryTime: deliveryTime || undefined,
      warranty: warranty || undefined,
      sizes: sizesArray.length > 0 ? sizesArray : undefined,
      colors: colorsArray.length > 0 ? colorsArray : undefined,
      features: featuresArray.length > 0 ? featuresArray : undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      specifications:
        Object.keys(specificationsObj).length > 0
          ? specificationsObj
          : undefined,
      variants: variantsArray.length > 0 ? variantsArray : undefined,
      batchConfig: Object.keys(batchConfigObj).length > 0 ? batchConfigObj : undefined,
      rating: 0,
      reviews: 0,
      views: 0,
      likes: 0,
    });

    // Populate seller and store information
    const product = await Products.findById(newProduct._id)
      .populate({
        path: "seller",
        select: "firstname lastname campus rating totalSales responseTime",
      })
      .populate({
        path: "store",
        select: "name logo verified",
      });

    // Update store with product reference
    try {
      console.log("Updating store with product reference...");

      const storeUpdateResult = await Stores.findByIdAndUpdate(
        storeId,
        { $push: { products: newProduct._id } },
        { new: true, runValidators: true }
      );

      console.log(
        "Store update result:",
        storeUpdateResult ? "Success" : "Failed"
      );
    } catch (storeUpdateError) {
      console.error("Error updating store:", storeUpdateError);
      console.warn("Product created but failed to update store reference");
    }

    return res.status(201).json({
      message: "Product successfully created",
      data: product,
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



