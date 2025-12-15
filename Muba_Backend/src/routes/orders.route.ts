import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";

import { UpdateVendorOrder } from "../controllers/order/update.controller";
import {
  GetOrderById,
  GetVendorOrders,
  GetCustomerOrders,
} from "../controllers/order/get.controller";

const router = Router();

// Apply Auth Middleware to populate req.user
router.use(AuthMiddleware);

router.get("/my-orders", GetCustomerOrders);

router.get("/", GetVendorOrders);

router.get("/:_id", GetOrderById);

// General update endpoint for status and delivery
router.patch("/:_id", UpdateVendorOrder);

export default router;
