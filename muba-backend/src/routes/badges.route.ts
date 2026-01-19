import express from "express";
import type { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware.ts";
import { GetBadgeEligibility } from "../controllers/badges/getBadgeEligibility.controller.ts";
import { MintBadge } from "../controllers/badges/mintBadge.controller.ts";

const router = express.Router();

// /api/v1/badge/eligible
router.get("/eligible", AuthMiddleware, GetBadgeEligibility);

// /api/v1/badge/mint
router.post("/mint", AuthMiddleware, MintBadge);

export default router;



