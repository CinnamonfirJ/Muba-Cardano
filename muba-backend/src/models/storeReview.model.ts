import pkg from "mongoose";
const { model, models, Schema } = pkg;

const StoreReviewSchema = new Schema(
  {
    store: {
      type: Schema.Types.ObjectId,
      ref: "Stores",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const StoreReview =
  models.StoreReview || model("StoreReview", StoreReviewSchema);

export default StoreReview;


