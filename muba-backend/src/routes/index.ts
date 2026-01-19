import express from "express";
import type { Router } from "express";
import AuthRoutes from "./auth.route.ts";
import StoreRoutes from "./stores.route.ts";
import ProductRoutes from "./products.route.ts";
import VendorRoutes from "./vendors.route.ts";
import UserRoutes from "./users.route.ts";
import CartRoutes from "./cart.route.ts";
import adminRoutes from "./admin.route.ts";
import PaymentRoutes from "./payment.route.ts";
import OrdersRoutes from "./orders.route.ts";

import DeliveryRoutes from "./delivery.route.ts";
import PostOfficeRoutes from "./postOffice.route.ts";

import BadgeRoutes from "./badges.route.ts";
import RewardsRoutes from "./rewards.route.ts";
import UploadRoutes from "./upload.route.ts";
import AnalyticsRoutes from "./analytics.route.ts";

const router = express.Router();

router.use("/auth", AuthRoutes);
router.use("/stores", StoreRoutes);
router.use("/products", ProductRoutes);
router.use("/vendors", VendorRoutes);
router.use("/users", UserRoutes);
router.use("/cart", CartRoutes);
router.use("/admin", adminRoutes);
router.use("/payment", PaymentRoutes);
router.use("/order", OrdersRoutes);
router.use("/delivery", DeliveryRoutes);
router.use("/post-office", PostOfficeRoutes);
router.use("/badge", BadgeRoutes);
router.use("/rewards", RewardsRoutes);
router.use("/upload", UploadRoutes);
router.use("/analytics", AnalyticsRoutes);

export default router;


