import { Router } from "express";
import AuthRoutes from "./auth.route";
import StoreRoutes from "./stores.route";
import ProductRoutes from "./products.route";
import VendorRoutes from "./vendors.route";
import UserRoutes from "./users.route";
import CartRoutes from "./cart.route";
import adminRoutes from "./admin.route";
import PaymentRoutes from "./payment.route";
import OrdersRoutes from "./orders.route";

import DeliveryRoutes from "./delivery.route";

const router = Router();

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

export default router;
