import express from "express";
import {
  GetAdminAnalytics,
  GetVendorAnalytics,
  GetPostOfficeAnalytics,
  GetCustomerAnalytics,
  GetVendorReviews,
  GetPublicAnalytics,
} from "../controllers/analytics.controller.ts";
import { AuthMiddleware } from "../middlewares/auth.middleware.ts";
import { CheckAdmin } from "../middlewares/checkAdmin.middleware.ts";
import { CheckVendor } from "../middlewares/checkVendor.middleware.ts";
import { CheckPostOffice } from "../middlewares/checkPostOffice.middleware.ts";

const router = express.Router();

// Admin Analytics (Global)
router.get("/admin", AuthMiddleware, CheckAdmin, GetAdminAnalytics);

// Vendor Analytics (Business scoped)
router.get("/vendor", AuthMiddleware, CheckVendor, GetVendorAnalytics);
router.get("/vendor/reviews", AuthMiddleware, CheckVendor, GetVendorReviews);

// Post Office Analytics (Delivery scoped)
router.get("/post-office", AuthMiddleware, CheckPostOffice, GetPostOfficeAnalytics);

// Customer Analytics (Personal scoped)
router.get("/customer", AuthMiddleware, GetCustomerAnalytics);

// Public Analytics (Landing Page)
router.get("/public", GetPublicAnalytics);

export default router;

