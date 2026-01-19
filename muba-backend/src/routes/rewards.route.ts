import express from "express";
import type { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware.ts";
import { SendReward } from "../controllers/rewards/sendReward.controller.ts";

const router = express.Router();

// /api/v1/rewards/send
router.post("/send", AuthMiddleware, SendReward);

export default router;



