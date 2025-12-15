import express from "express";
import {
  GetAllVendorApplications,
  GetPendingVendorApplications,
  GetVendorApplication,
  ApproveVendorApplication,
  RejectVendorApplication,
  GetAdminStats,
  GetUsersByRole,
  ToggleUserBan,
} from "../controllers/admin/admin.controller";
// import { authenticateToken } from "../middleware/auth.middleware"; // Comment out if you don't have this
// import { CheckAdmin } from "../middleware/checkAdmin.middleware";

const router = express.Router();

// Simple routes without authentication (for testing)
// Following the pattern: /api/v1/vendors to match frontend expectation

// Main vendor applications route (matches frontend expectation)
router.get("/vendors", GetAllVendorApplications); // GET /api/v1/admin/vendors

// Get pending vendor applications specifically for overview
router.get("/vendors/pending", GetPendingVendorApplications); // GET /api/v1/admin/vendors/pending

// Admin Dashboard Routes
router.get("/stats", GetAdminStats);

// Single vendor application routes
router.get("/vendors/:_id", GetVendorApplication);
router.patch("/vendors/:_id/approve", ApproveVendorApplication);
router.patch("/vendors/:_id/reject", RejectVendorApplication);

// User Management Routes
router.get("/users", GetUsersByRole);
router.patch("/users/:_id/ban", ToggleUserBan);

// PRODUCTION: Routes with authentication (uncomment when ready)
// router.get("/vendors", authenticateToken, CheckAdmin, GetAllVendorApplications);
// router.get("/vendors/pending", authenticateToken, CheckAdmin, GetPendingVendorApplications);
// router.get("/stats", authenticateToken, CheckAdmin, GetAdminStats);
// router.get("/vendors/:_id", authenticateToken, CheckAdmin, GetVendorApplication);
// router.patch("/vendors/:_id/approve", authenticateToken, CheckAdmin, ApproveVendorApplication);
// router.patch("/vendors/:_id/reject", authenticateToken, CheckAdmin, RejectVendorApplication);
// router.get("/users", authenticateToken, CheckAdmin, GetUsersByRole);
// router.patch("/users/:_id/ban", authenticateToken, CheckAdmin, ToggleUserBan);

// router.patch("/users/:_id/ban", authenticateToken, CheckAdmin, ToggleUserBan);

export default router;
