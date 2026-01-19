import express from "express";
import type { Router } from "express";
import { HandoverItem, PickupItem } from "../controllers/delivery/postOffice.controller.ts";
import { MarkAsReadyForPickup } from "../controllers/delivery/markReady.controller.ts";
import { ConfirmP2PDelivery } from "../controllers/delivery/p2p.controller.ts";
import { AuthMiddleware } from "../middlewares/auth.middleware.ts";
import { CheckVendor } from "../middlewares/checkVendor.middleware.ts"; // Handover might be restrictive? 
// For now, assume Handover is done by authenticated users (sellers/staff).

const router = express.Router();

// Handover: Seller/Staff initiates
router.post("/handover", AuthMiddleware, HandoverItem);

// Pickup: Buyer initiates (or Staff scans buyer's code)
router.post("/pickup", AuthMiddleware, PickupItem);

// P2P Confirmation: Buyer confirms receipt directly
router.post("/p2p/confirm", AuthMiddleware, ConfirmP2PDelivery);

// Mark as Ready for Pickup: Post Office staff marks order ready
router.post("/mark-ready/:orderId", AuthMiddleware, MarkAsReadyForPickup);

export default router;



