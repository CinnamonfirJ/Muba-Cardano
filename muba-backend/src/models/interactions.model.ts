import pkg from "mongoose";
const { model, models, Schema } = pkg;
import type { InteractionTypes } from "../dto/interactions.dto.ts";

const InteractionSchema = new Schema<InteractionTypes>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Products",
      required: true,
    },
    interactionType: {
      type: String,
      enum: ["view", "cart", "like", "purchase"],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Index for fast recommendation queries
InteractionSchema.index({ userId: 1, category: 1 });
InteractionSchema.index({ userId: 1, productId: 1, interactionType: 1 });

const Interactions = models.Interactions || model<InteractionTypes>("Interactions", InteractionSchema);

export default Interactions;




