import pkg from "mongoose";
const { Schema, model, models } = pkg;

/**
 * AdminAuditLog Model
 * 
 * Tracks all administrative actions for security and compliance.
 * Every admin API call is logged with full context.
 */
const AdminAuditLogSchema = new Schema(
  {
    admin_id: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true,
    },
    admin_email: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      // Format: "METHOD /path"
    },
    request_body: {
      type: Schema.Types.Mixed,
      // Sanitized request body (passwords/tokens removed)
    },
    target_entity: {
      type: String,
      // e.g., "vendor_application", "user", "post_office"
    },
    target_id: {
      type: String,
      // ID of the entity being modified
    },
    ip_address: {
      type: String,
    },
    user_agent: {
      type: String,
    },
    response_status: {
      type: Number,
      // HTTP response status code
    },
  },
  { timestamps: true }
);

// Index for efficient querying
AdminAuditLogSchema.index({ createdAt: -1 });
AdminAuditLogSchema.index({ admin_id: 1, createdAt: -1 });
AdminAuditLogSchema.index({ action: 1, createdAt: -1 });

const AdminAuditLog =
  models.AdminAuditLog || model("AdminAuditLog", AdminAuditLogSchema);

export default AdminAuditLog;
