import pkg from "mongoose";
const { Schema, model, models } = pkg;

const VendorOrderSchema = new Schema(
  {
    refId: {
      type: String,
      unique: true,
      index: true,
    },
    order_id: {
      type: Schema.Types.ObjectId,
      ref: "Orders",
      required: true,
    },
    vendor_id: {
      // Using Stores as the vendor entity
      type: Schema.Types.ObjectId,
      ref: "Stores",
      required: true,
    },
    customer_id: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    items: [
      {
        product_id: { type: Schema.Types.ObjectId, ref: "Products" },
        quantity: Number,
        price: Number,
        name: String,
        img: [],
        variant: String, // Optional variant info
      },
    ],
    delivery_option: {
      type: String,
      enum: ["school_post", "self", "rider", "peer_to_peer"],
      default: "school_post",
    },
    delivery_fee: {
      type: Number,
      default: 0,
    },
    service_fee: {
      type: Number,
      default: 0,
    },
    total_amount: {
      type: Number,
      required: true,
      default: 0,
    },
    platform_fee: {
        type: Number,
        default: 0
    },
    vendor_earnings: {
        type: Number,
        default: 0
    },
    // --- PAYSTACK SPLIT FIELDS ---
    paystack_split_code: {
        type: String, // SPLIT_xxxxxxxx
    },
    paystack_subaccount_code: {
        type: String, // ACCT_xxxxxxxx (Snapshot of vendor subaccount at time of order)
    },
    
    // --- DISPUTE FIELDS ---
    dispute_status: {
        type: String,
        enum: ["none", "open", "resolved"],
        default: "none"
    },
    active_dispute_id: {
        type: Schema.Types.ObjectId,
        ref: "Disputes"
    },

    // Old manual payout fields REMOVED
    // payout_status, payout_requested_at, etc. are deprecated.
    // We keep `vendor_earnings` and `platform_fee` for audit.
    // For third-party rider
    rider_info: {
      name: String,
      phone: String,
    },
    // QR Codes for parcel lifecycle
    vendor_qr_code: {
      type: String,
      // Generated when order is created, used for vendor handoff to post office
    },
    client_qr_code: {
      type: String,
      // Generated when post office receives parcel, used for client pickup
    },
    is_pickup_order: {
      type: Boolean,
      default: false,
      // Set via pre-save hook or during creation based on delivery_option
    },
    status: {
      type: String,
      default: "order_confirmed",
      enum: [
        "pending_payment",
        "paid",
        "order_confirmed",
        "handed_to_post_office",
        "ready_for_pickup",
        "delivered",
        "cancelled",
        "shipped",
        "dispatched"
      ],
    },
  },
  { timestamps: true }
);

const VendorOrders =
  models.VendorOrders || model("VendorOrders", VendorOrderSchema);

export default VendorOrders;
