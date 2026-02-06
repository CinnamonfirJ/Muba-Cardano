import pkg from "mongoose";
const { Schema, model, models } = pkg;

/**
 * MeetupLocation Model
 * 
 * Represents vendor-defined pickup/meetup locations where customers can
 * collect their orders. Used for location intersection in multi-vendor orders.
 */
const MeetupLocationSchema = new Schema(
  {
    store_id: {
      type: Schema.Types.ObjectId,
      ref: "Stores",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      // e.g., "Main Campus Gate", "SUB Building"
    },
    address: {
      type: String,
      required: true,
      trim: true,
      // e.g., "Behind SUB Building, Near the ATM"
    },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    // Geohash for fast intersection matching
    // 9-char precision = ~5m accuracy
    location_hash: {
      type: String,
      index: true,
    },
    // Soft delete support
    is_active: {
      type: Boolean,
      default: true,
    },
    // Optional: operating hours
    operating_hours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    // Optional: additional notes
    notes: {
      type: String,
      trim: true,
      // e.g., "Look for the blue umbrella", "Call on arrival"
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
MeetupLocationSchema.index({ store_id: 1, is_active: 1 });
MeetupLocationSchema.index({ location_hash: 1, is_active: 1 });
MeetupLocationSchema.index({ location_hash: 1, store_id: 1 });

/**
 * Generate geohash from coordinates before save
 * Uses simple grid-based hashing for campus-level precision
 */
MeetupLocationSchema.pre("save", function (next) {
  if (this.isModified("coordinates")) {
    if (!this.coordinates) return next();
    const { lat, lng } = this.coordinates;
    // Simple geohash: 4 decimal places (~11m precision)
    // Format: "lat_lng" normalized
    this.location_hash = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
  }
  next();
});

const MeetupLocations =
  models.MeetupLocations || model("MeetupLocations", MeetupLocationSchema);

export default MeetupLocations;
