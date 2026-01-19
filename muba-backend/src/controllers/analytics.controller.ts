import express from "express";
import type { Request, Response } from "express";
import Users from "../models/users.model.ts";
import Products from "../models/products.model.ts";
import Orders from "../models/order.model.ts";
import VendorOrders from "../models/vendorOrder.model.ts";
import Payments from "../models/payment.models.ts";
import Stores from "../models/stores.model.ts";
import mongoose from "mongoose";

/**
 * ADMIN ANALYTICS: Global platform view
 */
export const GetAdminAnalytics = async (req: Request, res: Response) => {
  try {
    const [
      productStats,
      orderStats,
      revenueStats,
      userStats,
      vendorStats,
      deliveryStats
    ] = await Promise.all([
      // Product Stats
      Products.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          }
        }
      ]),
      // Order Stats
      Orders.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            successful: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
            refunded: { $sum: { $cond: [{ $eq: ["$status", "refunded"] }, 1, 0] } },
          }
        }
      ]),
      // Revenue & Fees
      VendorOrders.aggregate([
        { $match: { status: "delivered" } },
        {
          $group: {
            _id: null,
            grossRevenue: { $sum: "$total_amount" },
            platformEarnings: { $sum: "$platform_fee" },
            deliveryFees: { $sum: "$delivery_fee" },
            vendorPayouts: { $sum: "$vendor_earnings" }
          }
        }
      ]),
      // User Stats
      Users.countDocuments({ role: "user" }),
      // Vendor Stats
      Users.countDocuments({ role: "vendor", vendorStatus: "accepted" }),
      // Delivery Stats
      VendorOrders.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            delivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $in: ["$status", ["handed_to_post_office", "ready_for_pickup", "shipped", "dispatched"]] }, 1, 0] } },
          }
        }
      ])
    ]);

    const data = {
      products: {
        total: productStats[0]?.total || 0,
        active: productStats[0]?.active || 0,
      },
      orders: {
        total: orderStats[0]?.totalOrders || 0,
        successful: orderStats[0]?.successful || 0,
        cancelled: orderStats[0]?.cancelled || 0,
        refunded: orderStats[0]?.refunded || 0,
      },
      revenue: {
        gross: revenueStats[0]?.grossRevenue || 0,
        platform: revenueStats[0]?.platformEarnings || 0,
        payouts: revenueStats[0]?.vendorPayouts || 0,
        delivery: revenueStats[0]?.deliveryFees || 0,
      },
      growth: {
        users: userStats,
        vendors: vendorStats,
      },
      delivery: {
        total: deliveryStats[0]?.total || 0,
        successful: deliveryStats[0]?.delivered || 0,
        pending: deliveryStats[0]?.inProgress || 0,
      }
    };

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Admin Analytics Error:", error);
    return res.status(500).json({ message: "Failed to fetch admin analytics" });
  }
};

/**
 * VENDOR ANALYTICS: Scoped to the vendor's stores
 */
export const GetVendorAnalytics = async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    // Find vendor's stores first
    const vendorStores = await Stores.find({ owner: user._id }).select("_id").lean();
    const storeIds = vendorStores.map(s => s._id);

    const [salesStats, productStats, payoutStats] = await Promise.all([
      // Sales Stats
      VendorOrders.aggregate([
        { $match: { vendor_id: { $in: storeIds } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            successfulOrders: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
            cancelledOrders: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
            totalEarnings: { $sum: "$vendor_earnings" },
            pendingEscrow: { $sum: { $cond: [{ $ne: ["$status", "delivered"] }, "$vendor_earnings", 0] } }
          }
        }
      ]),
      // Product Stats
      Products.countDocuments({ seller: user._id }),
      // Recent Sales Trend (Last 7 days)
      VendorOrders.aggregate([
        { 
          $match: { 
            vendor_id: { $in: storeIds },
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            sales: { $sum: "$vendor_earnings" },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const data = {
      sales: {
        total: salesStats[0]?.totalOrders || 0,
        completed: salesStats[0]?.successfulOrders || 0,
        cancelled: salesStats[0]?.cancelledOrders || 0,
      },
      earnings: {
        total: salesStats[0]?.totalEarnings || 0,
        pending: salesStats[0]?.pendingEscrow || 0,
      },
      products: {
        total: productStats,
      },
      trend: payoutStats
    };

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Vendor Analytics Error:", error);
    return res.status(500).json({ message: "Failed to fetch vendor analytics" });
  }
};

/**
 * PUBLIC ANALYTICS: Landing page stats (no auth)
 */
export const GetPublicAnalytics = async (req: Request, res: Response) => {
  try {
    const [productCount, vendorCount, completedOrders] = await Promise.all([
      Products.countDocuments({ status: "active" }),
      Users.countDocuments({ role: "vendor", vendorStatus: "accepted" }),
      Orders.countDocuments({ status: "delivered" }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        products: productCount,
        vendors: vendorCount,
        completedOrders,
      },
    });
  } catch (error) {
    console.error("Public Analytics Error:", error);
    return res.status(500).json({ message: "Failed to fetch public analytics" });
  }
};


/**
 * POST OFFICE ANALYTICS: Scoped to handover activity
 */
export const GetPostOfficeAnalytics = async (req: Request, res: Response) => {
  // Post offices operate on handed over items. 
  // We identify them by who processed the Handover record if possible, 
  // but currently handover records don't strictly track 'which' post office yet if there are multiple.
  // Assuming platform-wide PO view for now or filtering by staff if added later.
  try {
    const deliveryStats = await VendorOrders.aggregate([
      { $match: { delivery_option: "school_post" } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          handedOver: { $sum: { $cond: [{ $eq: ["$status", "handed_to_post_office"] }, 1, 0] } },
          readyForPickup: { $sum: { $cond: [{ $eq: ["$status", "ready_for_pickup"] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
        }
      }
    ]);

    const data = {
      deliveries: {
        total: deliveryStats[0]?.total || 0,
        pendingHandoff: deliveryStats[0]?.total - (deliveryStats[0]?.handedOver + deliveryStats[0]?.readyForPickup + deliveryStats[0]?.delivered) || 0,
        atPostOffice: (deliveryStats[0]?.handedOver || 0) + (deliveryStats[0]?.readyForPickup || 0),
        completed: deliveryStats[0]?.delivered || 0,
      },
      efficiency: {
          successRate: deliveryStats[0]?.total > 0 ? (deliveryStats[0]?.delivered / deliveryStats[0]?.total) * 100 : 0
      }
    };

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Post Office Analytics Error:", error);
    return res.status(500).json({ message: "Failed to fetch post office analytics" });
  }
};

import ProductReview from "../models/productReview.model.ts";
import StoreReview from "../models/storeReview.model.ts";

/**
 * VENDOR REVIEWS: Recent feedback across all owned stores
 */
export const GetVendorReviews = async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const vendorStores = await Stores.find({ owner: user._id }).select("_id").lean();
    const storeIds = vendorStores.map(s => s._id);

    const reviews = await StoreReview.find({ store: { $in: storeIds } })
      .populate("user", "firstname lastname profile_img")
      .populate("store", "name")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    console.error("Vendor Reviews Error:", error);
    return res.status(500).json({ message: "Failed to fetch vendor reviews" });
  }
};

/**
 * CUSTOMER ANALYTICS: Personalized activity
 */
export const GetCustomerAnalytics = async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const [orderStats, reviewCount, followCount] = await Promise.all([
      Orders.aggregate([
        { $match: { user_id: new mongoose.Types.ObjectId(user._id) } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $in: ["$status", ["paid", "pending"]] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
          }
        }
      ]),
      ProductReview.countDocuments({ user: user._id }),
      Stores.countDocuments({ followers: user._id })
    ]);

    const data = {
      orders: {
        total: orderStats[0]?.total || 0,
        active: orderStats[0]?.active || 0,
        completed: orderStats[0]?.completed || 0,
      },
      reviews: {
          total: reviewCount
      },
      following: {
          total: followCount
      }
    };

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Customer Analytics Error:", error);
    return res.status(500).json({ message: "Failed to fetch customer analytics" });
  }
};



