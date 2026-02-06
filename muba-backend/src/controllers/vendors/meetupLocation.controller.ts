import type { Request, Response, RequestHandler } from "express";
import MeetupLocations from "../../models/meetupLocation.model.ts";
import Stores from "../../models/stores.model.ts";

/**
 * Meetup Location CRUD Controller
 * 
 * Allows vendors to manage their pickup/meetup locations.
 */

/**
 * Create a new meetup location for a store
 * POST /stores/:storeId/meetup-locations
 */
export const CreateMeetupLocation: RequestHandler = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { name, address, coordinates, operating_hours, notes } = req.body;

    // Validate required fields
    if (!name || !address || !coordinates?.lat || !coordinates?.lng) {
      return res.status(400).json({
        success: false,
        message: "Name, address, and coordinates (lat/lng) are required",
      });
    }

    // Verify store exists
    const store = await Stores.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    // Create meetup location
    const location = await MeetupLocations.create({
      store_id: storeId,
      name: name.trim(),
      address: address.trim(),
      coordinates: {
        lat: parseFloat(coordinates.lat),
        lng: parseFloat(coordinates.lng),
      },
      operating_hours,
      notes: notes?.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Meetup location created successfully",
      data: location,
    });
  } catch (error) {
    console.error("CreateMeetupLocation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create meetup location",
    });
  }
};

/**
 * Get all meetup locations for a store
 * GET /stores/:storeId/meetup-locations
 */
export const GetMeetupLocations: RequestHandler = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { include_inactive } = req.query;

    const filter: any = { store_id: storeId };
    
    // By default, only return active locations
    if (include_inactive !== "true") {
      filter.is_active = true;
    }

    const locations = await MeetupLocations.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: locations,
      count: locations.length,
    });
  } catch (error) {
    console.error("GetMeetupLocations Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch meetup locations",
    });
  }
};

/**
 * Get a single meetup location
 * GET /stores/:storeId/meetup-locations/:locationId
 */
export const GetMeetupLocation: RequestHandler = async (req, res) => {
  try {
    const { storeId, locationId } = req.params;

    const location = await MeetupLocations.findOne({
      _id: locationId,
      store_id: storeId,
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Meetup location not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error("GetMeetupLocation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch meetup location",
    });
  }
};

/**
 * Update a meetup location
 * PUT /stores/:storeId/meetup-locations/:locationId
 */
export const UpdateMeetupLocation: RequestHandler = async (req, res) => {
  try {
    const { storeId, locationId } = req.params;
    const { name, address, coordinates, operating_hours, notes, is_active } = req.body;

    const location = await MeetupLocations.findOne({
      _id: locationId,
      store_id: storeId,
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Meetup location not found",
      });
    }

    // Update fields if provided
    if (name) location.name = name.trim();
    if (address) location.address = address.trim();
    if (coordinates?.lat && coordinates?.lng) {
      location.coordinates = {
        lat: parseFloat(coordinates.lat),
        lng: parseFloat(coordinates.lng),
      };
    }
    if (operating_hours !== undefined) location.operating_hours = operating_hours;
    if (notes !== undefined) location.notes = notes?.trim();
    if (is_active !== undefined) location.is_active = is_active;

    await location.save();

    return res.status(200).json({
      success: true,
      message: "Meetup location updated successfully",
      data: location,
    });
  } catch (error) {
    console.error("UpdateMeetupLocation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update meetup location",
    });
  }
};

/**
 * Soft delete a meetup location
 * DELETE /stores/:storeId/meetup-locations/:locationId
 */
export const DeleteMeetupLocation: RequestHandler = async (req, res) => {
  try {
    const { storeId, locationId } = req.params;

    const location = await MeetupLocations.findOne({
      _id: locationId,
      store_id: storeId,
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Meetup location not found",
      });
    }

    // Soft delete
    location.is_active = false;
    await location.save();

    return res.status(200).json({
      success: true,
      message: "Meetup location deleted successfully",
    });
  } catch (error) {
    console.error("DeleteMeetupLocation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete meetup location",
    });
  }
};
