import { Schema, model, models } from "mongoose";

const VendorOrderSchema = new Schema(
  {
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
      enum: ["school_post", "self", "rider"],
      default: "school_post",
    },
    delivery_fee: {
      type: Number,
      default: 0,
    },
    // For third-party rider
    rider_info: {
      name: String,
      phone: String,
    },
    status: {
      type: String,
      default: "pending",
      enum: [
        "pending",
        "confirmed",
        "processing",
        "sent_to_post_office", // corresponding to 'school_post'
        "out_for_delivery", // corresponding to 'self'
        "assigned_to_rider", // corresponding to 'rider'
        "delivered",
        "cancelled",
      ],
    },
  },
  { timestamps: true }
);

const VendorOrders =
  models.VendorOrders || model("VendorOrders", VendorOrderSchema);

export default VendorOrders;
