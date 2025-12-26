import { Types } from "mongoose";

export interface StoreTypes {
  name: string;
  description: string;
  img: string;
  location: string;
  owner: Types.ObjectId;
  rating?: number;
  followers?: number;
  reviewsCount?: number;
  reviews?: string[];
  categories?: string[];
  products?: Types.ObjectId[];
  // shippingPolicy?: string;
  // returnPolicy?: string;
  // warranty?: string;
  lastActive?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
