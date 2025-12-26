import { Router } from "express";
import { CheckVendor } from "../middlewares/checkVendor.middleware";
import { CreateStore } from "../controllers/stores/create.controller";
import {
  GetStore,
  GetStores,
  GetUserStores,
} from "../controllers/stores/get.controller";
import { VerifyStoreOwner } from "../middlewares/veifyOwner.middleware";
import { EditStoreDetails } from "../controllers/stores/edit.controller";
import { DeleteStore } from "../controllers/stores/delete.controller";
import { SearchStores } from "../controllers/stores/search.controller";
import { upload } from "../middlewares/upload.middleware";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import {
  FollowStore,
  UnfollowStore,
  RateStore,
  GetStoreReviews,
} from "../controllers/stores/engagement.controller";

const router = Router();

router
  .route("/")
  .post(AuthMiddleware, upload.fields([{ name: "img", maxCount: 1 }]), CheckVendor, CreateStore)
  .get(GetStores);

router.get("/user/:userId", GetUserStores);

router
  .route("/:_id") // for individual store
  .get(GetStore) // anyoune can get or view a particular store
  .patch(
    AuthMiddleware,
    upload.fields([{ name: "img", maxCount: 1 }]),
    CheckVendor,
    VerifyStoreOwner,
    EditStoreDetails
  ) // only vendors can edit/update store information (it's a protected route)
  .delete(AuthMiddleware, CheckVendor, VerifyStoreOwner, DeleteStore); // only vendors can delete store (it's a protected route)

router.route("/:_id/follow").post(AuthMiddleware, FollowStore);
router.route("/:_id/unfollow").post(AuthMiddleware, UnfollowStore);
router.route("/:_id/rate").post(AuthMiddleware, RateStore);
router.route("/:_id/reviews").get(GetStoreReviews);

router.route("/search").get(SearchStores);

export default router;
