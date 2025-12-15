import { model, models, Schema } from "mongoose";
import { StoreTypes } from "../dto/stores.dto";

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
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Stores = models.Stores || model<StoreTypes>("Stores", StoresSchema);

export default Stores;
