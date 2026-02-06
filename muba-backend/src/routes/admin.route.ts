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
} from "../controllers/admin/admin.controller.ts";
import { 
  GetPendingPostOfficeApplications, 
  ApprovePostOfficeApplication, 
  RejectPostOfficeApplication 
} from "../controllers/admin/postOfficeAdmin.controller.ts";

// Security Middlewares
import { AuthMiddleware } from "../middlewares/auth.middleware.ts";
import { CheckAdmin } from "../middlewares/checkAdmin.middleware.ts";
import { AdminAuditLogger } from "../middlewares/adminAudit.middleware.ts";

const router = express.Router();

/**
 * ADMIN ROUTES - PROTECTED
 * 
 * All routes require:
 * 1. AuthMiddleware - Verifies JWT token
 * 2. CheckAdmin - Verifies user.role === "admin"
 * 3. AdminAuditLogger - Logs all actions for security audit
 */

// Vendor Application Management
router.get("/vendors", AuthMiddleware, CheckAdmin, AdminAuditLogger, GetAllVendorApplications);
router.get("/vendors/pending", AuthMiddleware, CheckAdmin, AdminAuditLogger, GetPendingVendorApplications);
router.get("/vendors/:_id", AuthMiddleware, CheckAdmin, AdminAuditLogger, GetVendorApplication);
router.patch("/vendors/:_id/approve", AuthMiddleware, CheckAdmin, AdminAuditLogger, ApproveVendorApplication);
router.patch("/vendors/:_id/reject", AuthMiddleware, CheckAdmin, AdminAuditLogger, RejectVendorApplication);

// Admin Dashboard Stats
router.get("/stats", AuthMiddleware, CheckAdmin, AdminAuditLogger, GetAdminStats);

// User Management
router.get("/users", AuthMiddleware, CheckAdmin, AdminAuditLogger, GetUsersByRole);
router.patch("/users/:_id/ban", AuthMiddleware, CheckAdmin, AdminAuditLogger, ToggleUserBan);

// Post Office Management
router.get("/post-office/pending", AuthMiddleware, CheckAdmin, AdminAuditLogger, GetPendingPostOfficeApplications);
router.patch("/post-office/:id/approve", AuthMiddleware, CheckAdmin, AdminAuditLogger, ApprovePostOfficeApplication);
router.patch("/post-office/:id/reject", AuthMiddleware, CheckAdmin, AdminAuditLogger, RejectPostOfficeApplication);

export default router;
