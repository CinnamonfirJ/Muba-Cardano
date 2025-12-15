import { Types } from "mongoose";

type RoleTypes = "user" | "vendor" | "admin";
type VendorStatusTypes = "none" | "pending" | "accepted" | "rejected";

export interface UserTypes {
  firstname: string;
  lastname: string;
  middlename?: string;
  matric_number?: string;
  email: string;
  password: string;
  role: RoleTypes;
  profile_img?: string;
  rating?: number;
  cart?: Types.ObjectId[];
  stores?: Types.ObjectId[];
  refresh_token: string;
  vendorStatus: VendorStatusTypes;
  successful_deliveries?: number;
}
