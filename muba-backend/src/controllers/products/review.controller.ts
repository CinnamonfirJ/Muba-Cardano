import express from "express";
import type { Request, Response, RequestHandler } from "express";
import ProductReview from "../../models/productReview.model.ts";
import Products from "../../models/products.model.ts";
import Orders from "../../models/order.model.ts";
import VendorOrders from "../../models/vendorOrder.model.ts";
import { ORDER_STATUSES } from "../../utils/orderStatus.util.ts";

// Create Product Review
export const CreateProductReview: RequestHandler = async (req: any, res: any, next: any) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;
    const { orderId, rating, review, images } = req.body;

    if (!rating || !review || !orderId) {
      return res.status(400).json({ message: "Rating, review, and orderId are required" });
    }

    // 1. Verify VendorOrder exists and belongs to user
    const vendorOrder = await VendorOrders.findOne({
      _id: orderId,
      customer_id: userId,
    });
    
    if (!vendorOrder) {
        return res.status(404).json({ message: "Order not found or unauthorized" });
    }

    // Check if Product is in Order and is DELIVERED
    const item = vendorOrder.items.find(
        (i: any) => String(i.product_id._id || i.product_id) === String(productId)
    );

    if (!item) {
        return res.status(400).json({ message: "Product not found in this order" });
    }

    if (vendorOrder.status !== ORDER_STATUSES.DELIVERED) {
         return res.status(400).json({ message: "You can only review delivered products" });
    }

    // 2. Check overlap - Did they already review this exact order item?
    const existingReview = await ProductReview.findOne({
        product: productId,
        user: userId,
        order: orderId
    });

    if (existingReview) {
        return res.status(400).json({ message: "You have already reviewed this product for this order" });
    }

    // 3. Create Review
    const newReview = await ProductReview.create({
        product: productId,
        user: userId,
        order: orderId,
        rating,
        review,
        images: images || [] // URLs passed from frontend (Cloudinary)
    });

    // 4. Update Product Average Rating (Optimistic)
    // We could do this via aggregation more accurately
    const stats = await ProductReview.aggregate([
        { $match: { product: newReview.product } }, // Match by ObjectId
        {
            $group: {
                _id: "$product",
                avgRating: { $avg: "$rating" },
                count: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        await Products.findByIdAndUpdate(productId, {
            rating: Number(stats[0].avgRating.toFixed(1)),
            reviews: stats[0].count
        });
    }

    res.status(201).json({ message: "Review submitted", data: newReview });

  } catch (error: any) {
    console.error("Create Product Review Error:", error);
    res.status(500).json({ message: error.message || "Failed to create review" });
  }
};

// Get Product Reviews
export const GetProductReviews: RequestHandler = async (req: any, res: any, next: any) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const reviews = await ProductReview.find({ product: productId })
            .populate("user", "firstname lastname profile_img")
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));
            
        const total = await ProductReview.countDocuments({ product: productId });

        res.status(200).json({
            data: reviews,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit))
            }
        });

    } catch (error: any) {
        console.error("Get Product Reviews Error:", error);
        res.status(500).json({ message: error.message || "Failed to fetch reviews" });
    }
};

// Check Eligibility
export const CheckReviewEligibility: RequestHandler = async (req: any, res: any, next: any) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        // Find a delivered order for this product by this user in VendorOrders
        const order = await VendorOrders.findOne({
            customer_id: userId,
            status: ORDER_STATUSES.DELIVERED,
            "items.product_id": productId
        }).sort({ createdAt: -1 });

        if (!order) {
            return res.status(200).json({ eligible: false, message: "No delivered order found" });
        }

        // Check if already reviewed
        const existingReview = await ProductReview.findOne({
            product: productId,
            user: userId,
            order: order._id
        });

        if (existingReview) {
            return res.status(200).json({ eligible: false, hasReviewed: true, message: "Already reviewed" });
        }

        return res.status(200).json({ eligible: true, orderId: order._id });

    } catch (error: any) {
        console.error("Check Eligibility Error:", error);
        res.status(500).json({ message: error.message || "Failed to check eligibility" });
    }
};



