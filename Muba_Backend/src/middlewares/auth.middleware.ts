import { NextFunction, Request, Response } from "express";
import User from "../models/users.model";
import Jwt from "jsonwebtoken";
import { tokenConfig } from "../../config";

export const AuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.access_token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = Jwt.verify(token, tokenConfig.access);
    let userId: string | undefined;

    if (typeof decoded === "object" && "userId" in decoded) {
      userId = (decoded as { userId: string }).userId;
    }

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: Invalid token payload" });
    }

    const user = await User.findById(userId).select("-password -refresh_token");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Attach user to request
    (req as any).user = user;

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
};
