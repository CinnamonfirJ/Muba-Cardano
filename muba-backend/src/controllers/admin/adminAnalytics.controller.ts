import type { Request, Response } from "express";
import VendorOrders from "../../models/vendorOrder.model.ts";
import Orders from "../../models/order.model.ts";
import Products from "../../models/products.model.ts";
import Users from "../../models/users.model.ts";
import Stores from "../../models/stores.model.ts";

/**
 * Admin Analytics Controller
 * 
 * Provides accurate business metrics using the correct data sources:
 * - Platform Revenue: VendorOrders.platform_fee + Orders.service_fee
 * - Vendor Revenue: VendorOrders.vendor_earnings
 * - GMV: VendorOrders.total_amount
 */

/**
 * Get Platform Revenue Breakdown
 * 
 * MUBA Revenue = Platform Fees (from vendors) + Service Fees (from customers)
 * 
 * Business Rules:
 * - Orders >= ₦1,000: Platform gets 2.5% + ₦100 (vendor fee) + ₦100 (customer fee)
 * - Orders < ₦1,000: Platform gets 2.5% only
 */
export const GetPlatformRevenue = async (req: Request, res: Response) => {
  try {
    const { period } = req.query; // "daily" | "monthly" | "all"
    
    let dateFilter = {};
    const now = new Date();
    
    if (period === "daily") {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      dateFilter = { createdAt: { $gte: startOfDay } };
    } else if (period === "monthly") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { createdAt: { $gte: startOfMonth } };
    }

    const [platformFees, serviceFees, vendorPayouts] = await Promise.all([
      // Platform fees from VendorOrders (deducted from vendors)
      VendorOrders.aggregate([
        { $match: { status: { $in: ["paid", "delivered"] }, ...dateFilter } },
        {
          $group: {
            _id: null,
            totalPlatformFee: { $sum: "$platform_fee" },
            totalGMV: { $sum: "$total_amount" },
            totalVendorEarnings: { $sum: "$vendor_earnings" },
            orderCount: { $sum: 1 },
            itemsSold: { $sum: { $size: "$items" } },
          },
        },
      ]),
      // Service fees from Orders (paid by customers)
      Orders.aggregate([
        { $match: { status: "paid", ...dateFilter } },
        {
          $group: {
            _id: null,
            totalServiceFee: { $sum: "$service_fee" },
          },
        },
      ]),
      // Vendor earnings summary
      VendorOrders.aggregate([
        { $match: { status: "delivered", ...dateFilter } },
        {
          $group: {
            _id: null,
            totalPaidOut: { $sum: "$vendor_earnings" },
          },
        },
      ]),
    ]);

    const platformFeeTotal = platformFees[0]?.totalPlatformFee || 0;
    const serviceFeeTotal = serviceFees[0]?.totalServiceFee || 0;
    const totalMubaRevenue = platformFeeTotal + serviceFeeTotal;
    const gmv = platformFees[0]?.totalGMV || 0;
    const vendorEarnings = platformFees[0]?.totalVendorEarnings || 0;
    const vendorPaidOut = vendorPayouts[0]?.totalPaidOut || 0;

    return res.status(200).json({
      success: true,
      data: {
        // Company Metrics
        mubaRevenue: {
          total: totalMubaRevenue,
          platformFees: platformFeeTotal,
          serviceFees: serviceFeeTotal,
        },
        // Transaction Metrics
        transactions: {
          gmv: gmv,
          orderCount: platformFees[0]?.orderCount || 0,
          itemsSold: platformFees[0]?.itemsSold || 0,
        },
        // Vendor Metrics (Cumulative)
        vendorMetrics: {
          totalEarnings: vendorEarnings,
          totalPaidOut: vendorPaidOut,
          pendingPayout: vendorEarnings - vendorPaidOut,
        },
        // Period info
        period: period || "all",
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("GetPlatformRevenue Error:", error);
    return res.status(500).json({ message: "Failed to fetch platform revenue" });
  }
};

/**
 * Get Daily Transaction Volume (DTV)
 * Returns transaction data for the last 30 days
 */
export const GetDailyTransactionVolume = async (req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyVolume = await VendorOrders.aggregate([
      {
        $match: {
          status: { $in: ["paid", "delivered"] },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          gmv: { $sum: "$total_amount" },
          platformFee: { $sum: "$platform_fee" },
          vendorEarnings: { $sum: "$vendor_earnings" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Also get service fees by day
    const dailyServiceFees = await Orders.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          serviceFee: { $sum: "$service_fee" },
        },
      },
    ]);

    // Merge service fees into daily volume
    const serviceFeeMap = new Map(
      dailyServiceFees.map((d) => [d._id, d.serviceFee])
    );

    const enrichedVolume = dailyVolume.map((day) => ({
      date: day._id,
      gmv: day.gmv,
      platformFee: day.platformFee,
      serviceFee: serviceFeeMap.get(day._id) || 0,
      mubaRevenue: day.platformFee + (serviceFeeMap.get(day._id) || 0),
      vendorEarnings: day.vendorEarnings,
      orderCount: day.orderCount,
    }));

    return res.status(200).json({
      success: true,
      data: enrichedVolume,
    });
  } catch (error) {
    console.error("GetDailyTransactionVolume Error:", error);
    return res.status(500).json({ message: "Failed to fetch DTV" });
  }
};

/**
 * Get Vendor Leaderboard
 * Top vendors by revenue, orders, or products
 */
export const GetVendorLeaderboard = async (req: Request, res: Response) => {
  try {
    const { sortBy = "revenue", limit = 10 } = req.query;

    const leaderboard = await VendorOrders.aggregate([
      { $match: { status: { $in: ["paid", "delivered"] } } },
      {
        $group: {
          _id: "$vendor_id",
          totalRevenue: { $sum: "$vendor_earnings" },
          totalOrders: { $sum: 1 },
          totalItems: { $sum: { $size: "$items" } },
        },
      },
      {
        $lookup: {
          from: "stores",
          localField: "_id",
          foreignField: "_id",
          as: "store",
        },
      },
      { $unwind: { path: "$store", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          vendorId: "$_id",
          storeName: "$store.name",
          storeImg: "$store.img",
          totalRevenue: 1,
          totalOrders: 1,
          totalItems: 1,
        },
      },
      {
        $sort:
          sortBy === "orders"
            ? { totalOrders: -1 }
            : sortBy === "items"
            ? { totalItems: -1 }
            : { totalRevenue: -1 },
      },
      { $limit: Number(limit) },
    ]);

    return res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error("GetVendorLeaderboard Error:", error);
    return res.status(500).json({ message: "Failed to fetch vendor leaderboard" });
  }
};

/**
 * Get Products Created Count
 */
export const GetProductStats = async (req: Request, res: Response) => {
  try {
    const [productStats, storeStats, userStats] = await Promise.all([
      Products.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
            outOfStock: { $sum: { $cond: [{ $lte: ["$stock", 0] }, 1, 0] } },
          },
        },
      ]),
      Stores.countDocuments(),
      Users.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const userMap = new Map(userStats.map((u) => [u._id, u.count]));

    return res.status(200).json({
      success: true,
      data: {
        products: {
          total: productStats[0]?.total || 0,
          active: productStats[0]?.active || 0,
          outOfStock: productStats[0]?.outOfStock || 0,
        },
        stores: {
          total: storeStats,
        },
        users: {
          customers: userMap.get("user") || 0,
          vendors: userMap.get("vendor") || 0,
          admins: userMap.get("admin") || 0,
          postOffice: userMap.get("post_office") || 0,
        },
      },
    });
  } catch (error) {
    console.error("GetProductStats Error:", error);
    return res.status(500).json({ message: "Failed to fetch product stats" });
  }
};
