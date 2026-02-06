import type { Request, Response, RequestHandler } from "express";
import Cart from "../../models/cart.model.ts";
import { getMeetupEligibility } from "../../services/meetupIntersection.service.ts";

/**
 * Checkout Controller
 * 
 * Handles checkout-specific operations including meetup location availability.
 */

/**
 * Get available meetup locations for current cart
 * GET /checkout/available-meetup-locations
 * 
 * Returns common meetup locations that ALL vendors in the cart share.
 * For single-vendor carts, returns all that vendor's locations.
 */
export const GetAvailableMeetupLocations: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    
    if (!user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Get all cart items and extract unique store IDs
    const cartItems = await Cart.find({ user_id: user._id }).select("store");

    if (!cartItems || cartItems.length === 0) {
      return res.status(200).json({
        success: true,
        canProceed: false,
        isMultiVendor: false,
        vendorCount: 0,
        locations: [],
        reason: "Cart is empty",
      });
    }

    const storeIds = cartItems.map((item) => item.store.toString());
    const eligibility = await getMeetupEligibility(storeIds);

    return res.status(200).json({
      success: true,
      canProceed: eligibility.canProceed,
      isMultiVendor: eligibility.isMultiVendor,
      vendorCount: eligibility.vendorCount,
      locations: eligibility.commonLocations,
      availableCount: eligibility.availableCount,
      reason: eligibility.reason,
    });
  } catch (error) {
    console.error("GetAvailableMeetupLocations Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch available meetup locations",
    });
  }
};

/**
 * Validate selected meetup location for checkout
 * POST /checkout/validate-meetup-location
 * 
 * Ensures the selected location is still valid for all cart vendors.
 */
export const ValidateMeetupLocation: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { location_id } = req.body;

    if (!user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!location_id) {
      return res.status(400).json({
        success: false,
        message: "location_id is required",
      });
    }

    const cartItems = await Cart.find({ user_id: user._id }).select("store");
    const storeIds = [...new Set(cartItems.map((item) => item.store.toString()))];

    const eligibility = await getMeetupEligibility(storeIds);

    if (!eligibility.canProceed) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: eligibility.reason,
      });
    }

    // Check if selected location is in the common locations
    const isValid = eligibility.commonLocations.some(
      (loc: any) => loc._id.toString() === location_id
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: "Selected location is not available for all vendors in your cart",
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      message: "Location is valid for checkout",
    });
  } catch (error) {
    console.error("ValidateMeetupLocation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to validate meetup location",
    });
  }
};
