import express from "express";
import { GetVendor, GetVendors } from "../controllers/vendors/get.controller.ts";
import { RequestToBeVendor } from "../controllers/vendors/request.controller.ts";
import { CheckAdmin } from "../middlewares/checkAdmin.middleware.ts";
import { ValidateVendor } from "../controllers/vendors/validate.controller.ts";
import { upload } from "../middlewares/upload.middleware.ts";
import { CreateSubaccount, GetBanks } from "../controllers/vendors/subaccount.controller.ts";
import { AuthMiddleware } from "../middlewares/auth.middleware.ts";

const router = express.Router();

// Subaccount Routes
router.post("/payout-settings", AuthMiddleware, CreateSubaccount);
router.get("/banks", GetBanks);

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
