import express from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware.ts";
import { CheckAdmin } from "../middlewares/checkAdmin.middleware.ts";
import { AdminAuditLogger } from "../middlewares/adminAudit.middleware.ts";
import {
  GetPlatformRevenue,
  GetDailyTransactionVolume,
  GetVendorLeaderboard,
  GetProductStats,
  GetJointOrdersMetric,
} from "../controllers/admin/adminAnalytics.controller.ts";

const router = express.Router();

/**
 * ADMIN ANALYTICS ROUTES
 * 
 * Protected analytics endpoints for platform metrics.
 * All routes require admin authentication.
 */

// Platform Revenue (MUBA earnings)
router.get("/revenue", AuthMiddleware, CheckAdmin, AdminAuditLogger, GetPlatformRevenue);

// Daily Transaction Volume (last 30 days)
router.get("/dtv", AuthMiddleware, CheckAdmin, AdminAuditLogger, GetDailyTransactionVolume);

// Vendor Leaderboard
router.get("/vendors/leaderboard", AuthMiddleware, CheckAdmin, AdminAuditLogger, GetVendorLeaderboard);

// Product & User Stats
router.get("/products", AuthMiddleware, CheckAdmin, AdminAuditLogger, GetProductStats);

// Joint Orders Metric (multi-vendor orders)
router.get("/joint-orders", AuthMiddleware, CheckAdmin, AdminAuditLogger, GetJointOrdersMetric);

export default router;
