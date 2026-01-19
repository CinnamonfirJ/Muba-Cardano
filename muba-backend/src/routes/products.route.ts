import express from "express";
import { CheckVendor } from "../middlewares/checkVendor.middleware.ts";
import { AddProduct } from "../controllers/products/addProduct.controller.ts";
import { EditProduct } from "../controllers/products/editProduct.controller.ts";
import {
  GetProduct,
  GetProducts,
  GetProductsByStore,
  GetFeaturedProducts,
} from "../controllers/products/get.controller.ts";
import { DeleteProduct } from "../controllers/products/delete.controller.ts";
import { VerifyProductOwner } from "../middlewares/veifyOwner.middleware.ts";
import { SearchProducts } from "../controllers/products/search.controller.ts";
import { upload } from "../middlewares/upload.middleware.ts";
import { AuthMiddleware } from "../middlewares/auth.middleware.ts";
import { CreateProductReview, GetProductReviews, CheckReviewEligibility } from "../controllers/products/review.controller.ts";
import { ToggleLikeProduct, GetUserFavorites } from "../controllers/products/engagement.controller.ts";

const router = express.Router();

router
  .route("/")
  .post(AuthMiddleware, upload.array("images", 10), CheckVendor, AddProduct)
  .get(GetProducts);

router.get("/featured", GetFeaturedProducts);
router.route("/search").get(SearchProducts);

// Reviews
router.post("/:productId/review", AuthMiddleware, CreateProductReview);
router.get("/:productId/review/eligibility", AuthMiddleware, CheckReviewEligibility);
router.get("/:productId/reviews", GetProductReviews);

// Engagement
router.get("/user/favorites", AuthMiddleware, GetUserFavorites);
router.post("/:productId/like", AuthMiddleware, ToggleLikeProduct);

router.route("/store/:storeId").get(GetProductsByStore);

router
  .route("/:_id") // for individal product
  .get(GetProduct) // anyoune can get or view a particular product
  .patch(AuthMiddleware, upload.array("images", 10), CheckVendor, VerifyProductOwner, EditProduct) // only vendors can edit/update product information (it's a protected route)
  .delete(AuthMiddleware, CheckVendor, VerifyProductOwner, DeleteProduct); // only vendors can delete product (it's a protected route)

export default router;
