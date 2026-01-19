import express from "express";
import type { Router } from "express";
import { RegisterAsPostOffice } from "../controllers/postOffice/registration.controller.ts";
import { AuthMiddleware } from "../middlewares/auth.middleware.ts";

const router = express.Router();

// Apply (Authenticated User)
router.post("/register", AuthMiddleware, RegisterAsPostOffice);

export default router;



