import { Router } from "express";
import { GetVendor, GetVendors } from "../controllers/vendors/get.controller";
import { RequestToBeVendor } from "../controllers/vendors/request.controller";
import { CheckAdmin } from "../middlewares/checkAdmin.middleware";
import { ValidateVendor } from "../controllers/vendors/validate.controller";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.route("/")
        .post(
          upload.fields([
            { name: "valid_id", maxCount: 1 },
            { name: "picture", maxCount: 1 },
            { name: "cac", maxCount: 1 },
          ]),
          RequestToBeVendor
        )
        .get(GetVendors);

router.route("/:_id")
        .get(GetVendor)
        .patch(CheckAdmin, ValidateVendor);

export default router;
