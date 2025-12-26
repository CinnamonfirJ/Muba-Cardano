import { Router } from "express";
import { HandoverItem, PickupItem } from "../controllers/delivery/postOffice.controller";
import { MarkAsReadyForPickup } from "../controllers/delivery/markReady.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { CheckVendor } from "../middlewares/checkVendor.middleware"; // Handover might be restrictive? 
// For now, assume Handover is done by authenticated users (sellers/staff).

const router = Router();

// Handover: Seller/Staff initiates
router.post("/handover", AuthMiddleware, HandoverItem);

// Pickup: Buyer initiates (or Staff scans buyer's code)
router.post("/pickup", AuthMiddleware, PickupItem);

// Mark as Ready for Pickup: Post Office staff marks order ready
router.post("/mark-ready/:orderId", AuthMiddleware, MarkAsReadyForPickup);

export default router;
