import pkg from "mongoose";
const { Schema, model, models } = pkg;

export const DISPUTE_REASONS = [
  "item_missing",
  "item_damaged",
  "delivery_delayed",
  "wrong_item",
  "fake_item",
  "other"
] as const;

export const DISPUTE_STATUSES = [
  "open", // Created by customer
  "evidence_submitted", // Vendor or Customer added info
  "under_review", // Admin is looking
  "resolved_vendor", // Vendor won
  "resolved_customer", // Customer won
  "refunded", // Money returned
  "closed" // Cancelled/Resolved
] as const;

const DisputeSchema = new Schema(
  {
    order_id: {
      type: Schema.Types.ObjectId,
      ref: "Orders",
      required: true,
    },
    vendor_order_id: {
      type: Schema.Types.ObjectId,
      ref: "VendorOrders",
      required: true,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true, // The Buyer usually
    },
    vendor_id: {
      type: Schema.Types.ObjectId,
      ref: "Stores",
      required: true,
    },
    reason: {
      type: String,
      enum: DISPUTE_REASONS,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    evidence: [
      {
        type: String, // URLs to images/videos
      },
    ],
    status: {
      type: String,
      enum: DISPUTE_STATUSES,
      default: "open",
    },
    resolution: {
      outcome: { type: String }, // e.g., "Full Refund", "Partial Refund", "Dismissed"
      refunded_amount: { type: Number, default: 0 },
      admin_notes: { type: String },
      resolved_at: { type: Date },
      resolved_by: { type: Schema.Types.ObjectId, ref: "Users" }, // Admin ID
    },
    messages: [
      {
        sender: { type: Schema.Types.ObjectId, ref: "Users" },
        role: { type: String, enum: ["buyer", "vendor", "admin"] },
        message: { type: String },
        evidence: [{ type: String }],
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Disputes = models.Disputes || model("Disputes", DisputeSchema);

export default Disputes;
