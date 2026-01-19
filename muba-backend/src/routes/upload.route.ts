import express from "express";
import type { Router } from "express";
import { uploadReviewImages } from "../controllers/upload.controller.ts";
import { upload } from "../middlewares/upload.middleware.ts";
import { AuthMiddleware } from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.post("/review-images", AuthMiddleware, upload.array("images", 5), uploadReviewImages);

export default router;



