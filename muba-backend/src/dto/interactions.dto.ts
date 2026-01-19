import pkg from "mongoose";
const { Types } = pkg;

export type InteractionType = "view" | "cart" | "like" | "purchase";

export interface InteractionTypes {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  interactionType: InteractionType;
  category: string;
  createdAt?: Date;
  updatedAt?: Date;
}


