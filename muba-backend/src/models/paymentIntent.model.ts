import pkg from "mongoose";
const { model, models, Schema } = pkg;

const PaymentIntentSchema = new Schema(
  {
    reference: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    email: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    platform_fee: {
        type: Number,
        required: true
    },
    vendor_amount: {
        type: Number,
        required: true
    },
    cart_snapshot: [
        {
            product_id: { type: Schema.Types.ObjectId, ref: "Products" },
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
            }
        }
    ],
    vendor_splits: [
        {
            store_id: { type: Schema.Types.ObjectId, ref: "Stores" },
            subaccount: String,
            amount: Number, // Vendor amount in Naira
            share: Number,  // Order subtotal in Kobo
            platform_fee: Number // Platform fee for this vendor in Naira
        }
    ],
    shipping_info: {
        fullName: String,
        phone: String,
        address: String,
        email: String,
        deliveryMethod: String
    },
    cart_hash: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ["initiated", "completed", "failed"],
        default: "initiated"
    },
    order_id: {
        type: Schema.Types.ObjectId,
        ref: "Orders"
    }
  },
  { timestamps: true }
);

const PaymentIntents = models.PaymentIntents || model("PaymentIntents", PaymentIntentSchema);

export default PaymentIntents;
