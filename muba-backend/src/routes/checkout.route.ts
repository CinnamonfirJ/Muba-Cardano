import express from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware.ts";
import {
  GetAvailableMeetupLocations,
  ValidateMeetupLocation,
} from "../controllers/checkout/checkout.controller.ts";

const router = express.Router();

/**
 * CHECKOUT ROUTES
 * 
 * Pre-payment checkout operations including meetup location selection.
 */

// Get available meetup locations for cart (requires auth)
router.get("/available-meetup-locations", AuthMiddleware, GetAvailableMeetupLocations);

// Validate selected meetup location before payment
router.post("/validate-meetup-location", AuthMiddleware, ValidateMeetupLocation);

export default router;
