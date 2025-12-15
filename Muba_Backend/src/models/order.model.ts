import { Schema, model, models } from "mongoose";

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
        status: {
          type: String,
          default: "pending", // vendor updates this
          enum: ["pending", "processing", "shipped", "completed", "cancelled"],
        },
      },
    ],
    payment_reference: String,
    total: Number,
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
