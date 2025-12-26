import { Router } from "express";
import { SignUp } from "../controllers/auth/signup.controller";
import { SignIn } from "../controllers/auth/signin.controller";
import { RequestOtp } from "../controllers/auth/requestOtp.controller";
import { ResetPassword } from "../controllers/auth/resetPassword.controller";
import { ChangePassword } from "../controllers/auth/changePassword.controller";
import { RefreshToken } from "../controllers/auth/refresh.controller";
import { SignOut } from "../controllers/auth/signout.controller";

const router = Router();

router.route("/sign-up").post(SignUp);

router.route("/sign-in").post(SignIn);

router.route("/otp").post(RequestOtp);

router.route("/reset-password").post(ResetPassword);

router.route("/change-password").post(ChangePassword);

router.route("/refresh").post(RefreshToken);

router.route("/signout").post(SignOut);

export default router;
