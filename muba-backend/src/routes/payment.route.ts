import express from "express";
import { InitializePayment } from "../controllers/payments/init.controller.ts";
import { VerifyTransaction } from "../controllers/payments/verify.controller.ts";
import { GetPaymentStats } from "../controllers/payments/payment.controller.ts";
import { PaystackWebhook } from "../controllers/payments/webhook.controller.ts";

const router = express.Router();

// Payment Initialization & Fulfillment
router.route("/").post(InitializePayment);
router.post("/webhook", PaystackWebhook); 

// Core Verification
router.get("/verify/:reference", VerifyTransaction);

// Analytics
router.get("/stats", GetPaymentStats);

export default router;
