import { Router } from "express";
import { InitializePayment } from "../controllers/payments/init.controller";
import { VerifyTransaction } from "../controllers/payments/verify.controller";
import { GetPaymentStats } from "../controllers/payments/payment.controller";

const router = Router();

// would add a middleware to check fir authenticated users
// would add a middleware to check fir authenticated users
router.route("/").post(InitializePayment);
router.get("/verify/:reference", VerifyTransaction);

router.get("/stats", GetPaymentStats);

export default router;
