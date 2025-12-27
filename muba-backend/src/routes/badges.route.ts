import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { GetBadgeEligibility } from "../controllers/badges/getBadgeEligibility.controller";
import { MintBadge } from "../controllers/badges/mintBadge.controller";

const router = Router();

// /api/v1/badge/eligible
router.get("/eligible", AuthMiddleware, GetBadgeEligibility);

// /api/v1/badge/mint
router.post("/mint", AuthMiddleware, MintBadge);

export default router;
