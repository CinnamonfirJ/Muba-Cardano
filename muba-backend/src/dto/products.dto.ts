import { Types } from "mongoose";

export type ProductType = "single" | "variant" | "random" | "batch";

export interface CartTypes {
  // Relations
  product_id: Types.ObjectId; // cartId === productId
  user_id: Types.ObjectId;

  // Snapshot of product at time of adding to cart
  name: string;
  img: string[];
  description: string;
  category: string;

  // Purchase info
  quantity: number;
  price: number;

  // Store relation
  store: Types.ObjectId;

  // Timestamps (added by mongoose)
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductVariant {
  name?: string; // "Red / L"
  options?: string[]; // ["Red", "L"]
  price?: number;
  stock?: number;
  sku?: string;
  images?: string[];
  attributes?: Record<string, string>; // { color: "red", size: "L" }
}

export interface ProductTypes {
  // Basic Information
  title: string;
  description: string;
  images: string[];
  productType: ProductType;
  category: string[];
  condition: string;
  location: string;

  // Pricing & Stock
  price: number;
  originalPrice?: number;
  inStock: boolean;
  stockCount?: number;

  // Relations
  seller: Types.ObjectId;
  store: Types.ObjectId;

  // Variants
  variants?: ProductVariant[];
  variantType?: "None" | "Color" | "Size" | "Color+Size" | "Custom";

  // Batch / Group Orders
  batchConfig?: {
    minOrder?: number;
    currentOrder?: number;
    batchStatus?: "collecting" | "processing" | "completed" | "cancelled";
    batchDeadline?: Date;
  };

  // Product Details
  brand?: string;
  model?: string;
  weight?: string;
  dimensions?: string;
  material?: string;

  // Technical Specifications
  specifications?: Record<string, string>;

  // Shipping & Warranty
  deliveryTime?: string;
  warranty?: string;

  // Analytics & Engagement
  rating: number;
  reviews: number;
  views: number;
  likes: number;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}
