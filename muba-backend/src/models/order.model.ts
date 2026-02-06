import pkg from "mongoose";
const { Schema, model, models } = pkg;

const OrderSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    items: [
      {
        product_id: { type: Schema.Types.ObjectId, ref: "Products" },
        vendor_id: { type: Schema.Types.ObjectId, ref: "Users" }, // ← important
        store_id: { type: Schema.Types.ObjectId, ref: "Stores" },
        quantity: Number,
        price: Number,
        name: String,
        img: [],
        variant_selected: {
            name: String,
            options: [String],
            sku: String,
            attributes: { type: Map, of: String }
        },
        status: {
          type: String,
          default: "pending_payment",
          enum: ["pending_payment", "paid", "order_confirmed", "handed_to_post_office", "ready_for_pickup", "delivered", "cancelled"],
        },
        refId: String, // from VendorOrder
        vendor_qr_code: String, // for handoff
        client_qr_code: String, // for pickup
      },
    ],
    payment_reference: String,
    total: Number,
    delivery_fee: { type: Number, default: 0 },
    service_fee: { type: Number, default: 0 },
    // Meetup location snapshot (immutable after order creation)
    selected_meetup_location: {
      location_id: { type: Schema.Types.ObjectId, ref: "MeetupLocations" },
      name: String,
      address: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
      snapshot_at: Date, // When location was captured
    },
    // Multi-vendor order flag for analytics
    is_joint_order: {
      type: Boolean,
      default: false,
    },
    // Count of unique vendors in this order
    vendor_count: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "paid", "cancelled", "refunded"],
    },
  },
  { timestamps: true }
);

const Orders = models.Orders || model("Orders", OrderSchema);

export default Orders;
