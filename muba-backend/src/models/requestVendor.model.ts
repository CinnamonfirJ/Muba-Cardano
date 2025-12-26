import { model, models, Schema } from "mongoose";
import { RequestVendorTypes } from "../dto/requestVendor.dto";

const RequestVendorSchema = new Schema<RequestVendorTypes>({
  firstname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  matric_number: {
    type: String,
  },
  department: {
    type: String,
  },
  faculty: {
    type: String,
  },
  valid_id: {
    type: String,
    required: true,
  },
  picture: {
    type: String,
    required: true,
  },
  cac: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
});

const RequestVendor =
  models.VendorRequests ||
  model<RequestVendorTypes>("VendorRequests", RequestVendorSchema);

export default RequestVendor;
