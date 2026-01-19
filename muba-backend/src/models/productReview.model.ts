import pkg from "mongoose";
const { model, models, Schema } = pkg;

const ProductReviewSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Products",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Orders",
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
      trim: true,
    },
    images: {
      type: [String], // Array of image URLs
      default: [],
    },
  },
  { timestamps: true }
);

// Prevent multiple reviews from same user on same product? 
// Maybe allowed if different orders? For now, let's index to allow multiple but maybe unique per order logic in controller.
ProductReviewSchema.index({ product: 1, user: 1, order: 1 }, { unique: true });

const ProductReview =
  models.ProductReview || model("ProductReview", ProductReviewSchema);

export default ProductReview;


