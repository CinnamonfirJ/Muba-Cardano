import { model, models, Schema } from "mongoose";
import { CartTypes } from "../dto/products.dto";

const CartSchema = new Schema<CartTypes>({
    product_id: {
        type: Schema.Types.ObjectId,
        ref: "Products"
    }, // cartId === productId
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "Users"
    },
    name: {
      type: String,
      required: true,
    },
    img: {
      type: [],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      min: 1,
      default: 1,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: "Stores",
      required: true,
    },
  },
  { timestamps: true }
);

const Cart = models.Cart || model<CartTypes>("Cart", CartSchema);

export default Cart;
