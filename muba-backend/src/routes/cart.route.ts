import express from "express";
import type { Router } from "express";
import { AddToCart } from "../controllers/cart/addToCart.controller.ts";
import { RemoveFromCart } from "../controllers/cart/removeFromCart.controller.ts";
import { decreaseQty } from "../controllers/cart/decreaceQty.ts";
import { increaseQty } from "../controllers/cart/increaseQty.ts";
import { GetUserCart } from "../controllers/cart/getCart.ts";
import { DeleteAllFromCart } from "../controllers/cart/DeleteAllFromCart.controller.ts";
import { updateQty } from "../controllers/cart/updateQty.ts";

const router = express.Router();

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



