import express from "express";
import type { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware.ts";

import { UpdateVendorOrder } from "../controllers/order/update.controller.ts";
import {
  GetOrderById,
  GetVendorOrders,
  GetCustomerOrders,
  GetOrderByReference,
  DeleteOrder
} from "../controllers/order/get.controller.ts";

const router = express.Router();

// Apply Auth Middleware to populate req.user
router.use(AuthMiddleware);

router.get("/my-orders", GetCustomerOrders);
router.get("/by-reference/:reference", GetOrderByReference);
router.get("/", GetVendorOrders);
router.get("/:_id", GetOrderById);
router.delete("/:_id", DeleteOrder);

// General update endpoint for status and delivery
router.patch("/:_id", UpdateVendorOrder);

export default router;
