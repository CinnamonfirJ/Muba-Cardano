import pkg from "mongoose";
const { model, models, Schema } = pkg;
import type { StoreTypes } from "../dto/stores.dto.ts";

const StoresSchema = new Schema<StoreTypes>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    img: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    settlement_bank: {
      type: String, // Bank Code e.g "058"
    },
    bank_name: {
      type: String, // e.g., "GTBank"
    },
    account_number: {
      type: String,
    },
    paystack_subaccount_code: {
      type: String, // ACCT_xxxxxxxxx (Required for Split Payments)
    },
    paystack_subaccount_id: {
      type: String, // Integration ID from Paystack
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
    reviewsCount: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "StoreReview",
      },
    ],
    categories: [
      {
        type: String,
      },
    ],
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Products",
      },
    ],
    // shippingPolicy: {
    //   type: String,
    //   default: "",
    // },
    // returnPolicy: {
    //   type: String,
    //   default: "",
    // },
    // warranty: {
    //   type: String,
    //   default: "",
    // },

    // === PAYOUT SAFETY GATING ===
    // Products are ONLY visible when payout_ready = true
    payout_ready: {
      type: Boolean,
      default: false, // Becomes true when Paystack subaccount is verified
    },
    verification_requested: {
      type: Boolean,
      default: false, // True when vendor clicks "Verify Account"
    },
    verification_requested_at: {
      type: Date, // Timestamp when verification was requested
    },

    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Stores = models.Stores || model<StoreTypes>("Stores", StoresSchema);

export default Stores;
