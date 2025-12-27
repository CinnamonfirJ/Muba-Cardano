import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { SendReward } from "../controllers/rewards/sendReward.controller";

const router = Router();

// /api/v1/rewards/send
router.post("/send", AuthMiddleware, SendReward);

export default router;
