import express from "express";
import type { NextFunction, Request, Response } from "express";
import User from "../../models/users.model.ts";
import { CustomErr } from "../../utils/errors.utils.ts";

export const SignOut = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get user ID from auth middleware (assuming you have one)
    const userId = (req as any).user?.userId;

    if (userId) {
      // Clear refresh token from database
      await User.findByIdAndUpdate(userId, {
        refresh_token: null,
      });
    }

    // Clear both cookies
    res.clearCookie("access_token", {
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res.clearCookie("refresh_token", {
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (err) {
    return next(err);
  }
};



