import { model, models, Schema, Types } from "mongoose";
import { ProductTypes } from "../dto/products.dto";

const ProductSchema = new Schema<ProductTypes>(
  {
    // Product Type Classification
    productType: {
      type: String,
      enum: ["single", "variant", "batch", "random"],
      default: "single",
    },

    // Basic Information
    title: { type: String, required: true },
    description: { type: String, required: true },
    images: [{ type: String, required: true }],
    category: [{ type: String, required: true }],
    condition: { type: String, required: true },
    location: { type: String, required: true }, // Should be inherited from store (handled in controller)

    // Pricing & Stock (Global / Default)
    price: { type: Number, required: true }, // Base price or range start
    originalPrice: { type: Number },
    inStock: { type: Boolean, default: true },
    stockCount: { type: Number, default: 1, min: 0 },

    // Relations
    seller: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    store: { type: Schema.Types.ObjectId, ref: "Stores", required: true },

    // Variants (For "variable" or "random" types)
    variants: [
      {
        name: { type: String }, // e.g., "Red / L" or just "Red"
        options: [{ type: String }], // [Color: Red, Size: L] if storing structured
        price: { type: Number },
        stock: { type: Number },
        sku: { type: String },
        images: [{ type: String }],
        attributes: { type: Map, of: String }, // { color: "red", size: "L" }
      },
    ],

    // Simplified Variants for UI (User requested: Type / Color / Size)
    // We can store specific attributes for cleaner querying
    variantType: {
      type: String,
      enum: ["None", "Color", "Size", "Color+Size", "Custom"],
    },

    // Batch / Group Order Config
    batchConfig: {
      minOrder: { type: Number }, // e.g. 5 orders required
      currentOrder: { type: Number, default: 0 },
      batchStatus: {
        type: String,
        enum: ["collecting", "processing", "completed", "cancelled"],
        default: "collecting",
      },
      batchDeadline: { type: Date },
    },

    // Product Details
    brand: { type: String },
    model: { type: String },
    weight: { type: String },
    dimensions: { type: String },
    material: { type: String },

    // Technical Specifications
    specifications: {
      type: Map,
      of: String,
      default: {},
    },

    // Shipping & Warranty
    deliveryTime: { type: String },
    warranty: { type: String },

    // Analytics & Engagement
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Products =
  models.Products || model<ProductTypes>("Products", ProductSchema);

export default Products;
