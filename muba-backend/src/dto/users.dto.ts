import { Types } from "mongoose";

type RoleTypes = "user" | "vendor" | "admin" | "post_office" | "post_office_member";
type VendorStatusTypes = "none" | "pending" | "accepted" | "rejected";
type PostOfficeStatusTypes = "none" | "pending" | "accepted" | "rejected";

export interface UserTypes {
  firstname: string;
  lastname: string;
  middlename?: string;
  matric_number?: string;
  email: string;
  phone?: string;
  delivery_location?: string;
  alternative_phone?: string;
  password: string;
  role: RoleTypes;
  profile_img?: string;
  rating?: number;
  cart?: Types.ObjectId[];
  stores?: Types.ObjectId[];
  refresh_token: string;
  vendorStatus: VendorStatusTypes;
  postOfficeStatus?: PostOfficeStatusTypes;
  postOfficeName?: string;
  postOfficeDocs?: string[];
  successful_deliveries?: number;
}
