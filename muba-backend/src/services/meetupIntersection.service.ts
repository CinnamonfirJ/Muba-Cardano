import MeetupLocations from "../models/meetupLocation.model.ts";
import pkg from "mongoose";
const { Types } = pkg;

/**
 * Meetup Location Intersection Service
 * 
 * Provides efficient intersection logic for multi-vendor cart scenarios.
 * Uses MongoDB aggregation to find common meetup locations across vendors.
 */

/**
 * Get common meetup locations that ALL vendors in the cart share.
 * 
 * Algorithm:
 * - For single vendor: return all their active locations
 * - For multi-vendor: return only locations with matching geohash across all vendors
 * 
 * Uses MongoDB aggregation for O(1) DB calls regardless of vendor count.
 */
export const getCommonMeetupLocations = async (storeIds: string[]) => {
  if (storeIds.length === 0) {
    return [];
  }

  // Single vendor: return all their active locations
  if (storeIds.length === 1) {
    return MeetupLocations.find({
      store_id: storeIds[0],
      is_active: true,
    }).lean();
  }

  // Multi-vendor: find intersection by location_hash
  const objectIds = storeIds.map((id) => new Types.ObjectId(id));
  const vendorCount = storeIds.length;

  const result = await MeetupLocations.aggregate([
    // Step 1: Get all active locations from cart vendors
    {
      $match: {
        store_id: { $in: objectIds },
        is_active: true,
      },
    },
    // Step 2: Group by location_hash and collect vendor IDs
    {
      $group: {
        _id: "$location_hash",
        locations: { $push: "$$ROOT" },
        vendorSet: { $addToSet: "$store_id" },
      },
    },
    // Step 3: Keep only hashes where ALL vendors have a location
    {
      $match: {
        $expr: { $eq: [{ $size: "$vendorSet" }, vendorCount] },
      },
    },
    // Step 4: Return one representative location per hash
    {
      $project: {
        _id: 0,
        location_hash: "$_id",
        // Take the first location as representative
        representative: { $arrayElemAt: ["$locations", 0] },
        vendorCount: { $size: "$vendorSet" },
      },
    },
    // Step 5: Flatten to return the location object
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            "$representative",
            {
              shared_by_vendors: "$vendorCount",
              location_hash: "$location_hash",
            },
          ],
        },
      },
    },
  ]);

  return result;
};

/**
 * Check if a cart can proceed with meetup delivery
 * Returns detailed information about the cart's meetup eligibility
 */
export const getMeetupEligibility = async (storeIds: string[]) => {
  const uniqueStoreIds = [...new Set(storeIds)];
  
  if (uniqueStoreIds.length === 0) {
    return {
      canProceed: false,
      isMultiVendor: false,
      vendorCount: 0,
      commonLocations: [],
      reason: "Cart is empty",
    };
  }

  const commonLocations = await getCommonMeetupLocations(uniqueStoreIds);
  const isMultiVendor = uniqueStoreIds.length > 1;

  return {
    canProceed: commonLocations.length > 0,
    isMultiVendor,
    vendorCount: uniqueStoreIds.length,
    commonLocations,
    availableCount: commonLocations.length,
    reason:
      commonLocations.length > 0
        ? null
        : isMultiVendor
        ? "No common meetup locations between all vendors in your cart"
        : "This vendor has no meetup locations configured",
  };
};
