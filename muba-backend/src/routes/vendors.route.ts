import express from "express";
import { GetVendor, GetVendors } from "../controllers/vendors/get.controller.ts";
import { RequestToBeVendor } from "../controllers/vendors/request.controller.ts";
import { CheckAdmin } from "../middlewares/checkAdmin.middleware.ts";
import { ValidateVendor } from "../controllers/vendors/validate.controller.ts";
import { upload } from "../middlewares/upload.middleware.ts";
import { CreateSubaccount, GetBanks, DeactivateSubaccount } from "../controllers/vendors/subaccount.controller.ts";
import { RequestPayoutVerification, GetPayoutStatus } from "../controllers/vendors/verification.controller.ts";
import { AuthMiddleware } from "../middlewares/auth.middleware.ts";

const router = express.Router();

// Subaccount Routes
router.post("/payout-settings", AuthMiddleware, CreateSubaccount);
router.delete("/payout-settings", AuthMiddleware, DeactivateSubaccount); // Deletion Request
router.get("/banks", GetBanks);

// Payout Verification Routes
router.post("/request-payout-verification", AuthMiddleware, RequestPayoutVerification);
router.get("/payout-status/:storeId", AuthMiddleware, GetPayoutStatus);

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

