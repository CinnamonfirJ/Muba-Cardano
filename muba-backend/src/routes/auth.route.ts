import express from "express";
import type { Router } from "express";
import { SignUp } from "../controllers/auth/signup.controller.ts";
import { SignIn } from "../controllers/auth/signin.controller.ts";
import { RequestOtp } from "../controllers/auth/requestOtp.controller.ts";
import { ResetPassword } from "../controllers/auth/resetPassword.controller.ts";
import { ChangePassword } from "../controllers/auth/changePassword.controller.ts";
import { RefreshToken } from "../controllers/auth/refresh.controller.ts";
import { SignOut } from "../controllers/auth/signout.controller.ts";

const router = express.Router();

router.route("/sign-up").post(SignUp);

router.route("/sign-in").post(SignIn);

router.route("/otp").post(RequestOtp);

router.route("/reset-password").post(ResetPassword);

router.route("/change-password").post(ChangePassword);

router.route("/refresh").post(RefreshToken);

router.route("/signout").post(SignOut);

export default router;



