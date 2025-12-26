import { Router } from "express";
import { RegisterAsPostOffice } from "../controllers/postOffice/registration.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Apply (Authenticated User)
router.post("/register", AuthMiddleware, RegisterAsPostOffice);

export default router;
