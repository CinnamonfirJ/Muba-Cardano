import { Router } from "express";
import { CheckVendor } from "../middlewares/checkVendor.middleware";
import { AddProduct } from "../controllers/products/addProduct.controller";
import { EditProduct } from "../controllers/products/editProduct.controller";
import {
  GetProduct,
  GetProducts,
  GetProductsByStore,
} from "../controllers/products/get.controller";
import { DeleteProduct } from "../controllers/products/delete.controller";
import { VerifyProductOwner } from "../middlewares/veifyOwner.middleware";
import { SearchProducts } from "../controllers/products/search.controller";
import { upload } from "../middlewares/upload.middleware";

import { AuthMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router
  .route("/")
  .post(AuthMiddleware, upload.array("images", 10), CheckVendor, AddProduct)
  .get(GetProducts);

router.route("/search").get(SearchProducts);

router.route("/store/:storeId").get(GetProductsByStore);

router
  .route("/:_id") // for individal product
  .get(GetProduct) // anyoune can get or view a particular product
  .patch(AuthMiddleware, CheckVendor, VerifyProductOwner, EditProduct) // only vendors can edit/update product information (it's a protected route)
  .delete(AuthMiddleware, CheckVendor, VerifyProductOwner, DeleteProduct); // only vendors can delete product (it's a protected route)

export default router;
