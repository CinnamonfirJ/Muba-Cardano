import { Router } from "express";
import { AddToCart } from "../controllers/cart/addToCart.controller";
import { RemoveFromCart } from "../controllers/cart/removeFromCart.controller";
import { decreaseQty } from "../controllers/cart/decreaceQty";
import { increaseQty } from "../controllers/cart/increaseQty";
import { GetUserCart } from "../controllers/cart/getCart";
import { DeleteAllFromCart } from "../controllers/cart/DeleteAllFromCart.controller";
import { updateQty } from "../controllers/cart/updateQty";

const router = Router();

router.route("/").post(AddToCart);

router.get("/:userId", GetUserCart);

router.route("/:_id").post(RemoveFromCart);
// .patch(decreaseQty)
// .patch(increaseQty)

router.delete("/clear", DeleteAllFromCart);

router.route("/update-quantity").patch(updateQty);

router.route("/:_id/increase").patch(increaseQty);

router.route("/:_id/decrease").patch(decreaseQty);

export default router;
