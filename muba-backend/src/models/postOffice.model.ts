import pkg from "mongoose";
const { Schema, model, models } = pkg;

const PostOfficeHandoverSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Orders",
      required: true,
    },
    vendorOrderId: {
      type: Schema.Types.ObjectId,
      ref: "VendorOrders",
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    status: {
      type: String,
      enum: ["handed_over", "ready_for_pickup", "collected"],
      default: "handed_over",
    },
    handoverTime: {
      type: Date,
      default: Date.now,
    },
    pickupTime: {
      type: Date,
    },
    qrCode: {
      type: String, 
      required: true, // Unique token for this transaction
    },
    feedback: {
        rating: { type: String, enum: ['thumbs_up', 'thumbs_down'] },
        comment: String
    },
    // Cardano Proofs
    handoffTxHash: { type: String },
    deliveryTxHash: { type: String },
    
    blockHeight: { type: Number },
    onChainStatus: { 
        type: String, 
        enum: ['pending', 'confirmed', 'failed'],
        default: 'pending' 
    }
  },
  { timestamps: true }
);

const PostOfficeHandover = models.PostOfficeHandover || model("PostOfficeHandover", PostOfficeHandoverSchema);

export default PostOfficeHandover;


