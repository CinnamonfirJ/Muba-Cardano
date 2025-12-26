import { model, models, Schema } from "mongoose";
import { UserTypes } from "../dto/users.dto";

const UserSchema = new Schema<UserTypes>(
  {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    middlename: {
      type: String,
    },
    matric_number: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: false, // Not required for existing users
    },
    delivery_location: {
      type: String,
      required: false, // e.g., "Hostel A", "Building B Room 204"
    },
    alternative_phone: {
      type: String,
      required: false, // Optional backup contact
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      default: "user",
    },
    profile_img: {
      type: String,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
      default: 0,
    },
    successful_deliveries: {
      type: Number,
      default: 0,
    },
    cart: [
      {
        type: Schema.Types.ObjectId,
        ref: "Cart",
      },
    ],
    stores: [
      {
        type: Schema.Types.ObjectId,
        ref: "Stores",
      },
    ],
    refresh_token: {
      type: String,
    },
    vendorStatus: {
      type: String,
      enum: ["none", "pending", "accepted", "rejected"],
      default: "none",
    },
    postOfficeStatus: {
      type: String,
      enum: ["none", "pending", "accepted", "rejected"],
      default: "none",
    },
    postOfficeName: {
      type: String,
    },
    postOfficeDocs: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

const Users = models.Users || model<UserTypes>("Users", UserSchema);

export default Users;
