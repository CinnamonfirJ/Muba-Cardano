import { Types } from "mongoose";

export interface StoreTypes {
  name: string;
  description: string;
  img: string;
  location: string;
  settlement_bank?: string;
  bank_name?: string;
  account_number?: string;
  paystack_subaccount_code?: string;
  paystack_subaccount_id?: string;
  owner: Types.ObjectId;
  rating?: number;
  followers?: number;
  reviewsCount?: number;
  reviews?: string[];
  categories?: string[];
  products?: Types.ObjectId[];
  lastActive?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
