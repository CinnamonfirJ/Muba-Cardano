import express from "express";
import type { Request, Response } from "express";
import { uploadToCloudinary } from "../middlewares/upload.middleware.ts";

export const uploadReviewImages = async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];
        
        if (!files || files.length === 0) {
            return res.status(400).json({ message: "No files uploaded" });
        }

        const uploadPromises = files.map(file => 
            uploadToCloudinary(file.buffer, "product-reviews")
        );

        const imageUrls = await Promise.all(uploadPromises);

        return res.status(200).json({
            message: "Images uploaded successfully",
            urls: imageUrls
        });
    } catch (error: any) {
        console.error("Upload Images Error:", error);
        return res.status(500).json({ message: error.message || "Failed to upload images" });
    }
};



