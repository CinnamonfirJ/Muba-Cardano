import express from "express";
import { CheckVendor } from "../middlewares/checkVendor.middleware.ts";
import { CreateStore } from "../controllers/stores/create.controller.ts";
import {
  GetStore,
  GetStores,
  GetUserStores,
  GetMyStores,
  GetFollowedStores,
} from "../controllers/stores/get.controller.ts";
import { VerifyStoreOwner } from "../middlewares/veifyOwner.middleware.ts";
import { EditStoreDetails } from "../controllers/stores/edit.controller.ts";
import { DeleteStore } from "../controllers/stores/delete.controller.ts";
import { SearchStores } from "../controllers/stores/search.controller.ts";
import { upload } from "../middlewares/upload.middleware.ts";
import { AuthMiddleware } from "../middlewares/auth.middleware.ts";
import {
  FollowStore,
  UnfollowStore,
  RateStore,
  GetStoreReviews,
} from "../controllers/stores/engagement.controller.ts";

const router = express.Router();

router
  .route("/")
  .post(AuthMiddleware, upload.fields([{ name: "img", maxCount: 1 }]), CheckVendor, CreateStore)
  .get(GetStores);

router.get("/user/me", AuthMiddleware, GetMyStores);
router.get("/user/:userId", GetUserStores);
router.get("/followed", AuthMiddleware, GetFollowedStores);
router.route("/search").get(SearchStores);

router.route("/:_id/follow").post(AuthMiddleware, FollowStore);
router.route("/:_id/unfollow").post(AuthMiddleware, UnfollowStore);
router.route("/:_id/rate").post(AuthMiddleware, RateStore);
router.route("/:_id/reviews").get(GetStoreReviews);

router
  .route("/:_id") // for individual store
  .get(GetStore) // anyone can get or view a particular store
  .patch(
    AuthMiddleware,
    upload.fields([{ name: "img", maxCount: 1 }]),
    CheckVendor,
    VerifyStoreOwner,
    EditStoreDetails
  ) // only vendors can edit/update store information (it's a protected route)
  .delete(AuthMiddleware, CheckVendor, VerifyStoreOwner, DeleteStore); // only vendors can delete store (it's a protected route)

export default router;
