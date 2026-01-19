import express from "express";
import type { NextFunction, Request, Response } from "express";
import User from "../../models/users.model.ts";
import jwtPkg from "jsonwebtoken";
const Jwt = jwtPkg;
import { tokenConfig } from "../../../config/index.ts";
import { CustomErr } from "../../utils/errors.utils.ts";

// Helper function to manually parse cookies
const parseCookies = (
  cookieHeader: string | undefined
): Record<string, string> => {
  const cookies: Record<string, string> = {};

  if (!cookieHeader) return cookies;

  cookieHeader.split(";").forEach((cookie) => {
    const [name, value] = cookie.trim().split("=");
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });

  return cookies;
};

export const RefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let refreshToken: string | undefined;

    // Try to get from req.cookies first (if cookie-parser is working)
    if (req.cookies && req.cookies.refresh_token) {
      refreshToken = req.cookies.refresh_token;
    } else {
      // Fallback: manually parse cookies from header
      const cookies = parseCookies(req.headers.cookie);
      refreshToken = cookies.refresh_token;
    }

    if (!refreshToken) {
      throw new CustomErr("Refresh token not found", 401);
    }

    // Verify refresh token
    let decoded: any;
    try {
      decoded = Jwt.verify(refreshToken, tokenConfig.refresh);
    } catch (err: any) {
      if (err.name === "JsonWebTokenError") {
        throw new CustomErr("Invalid refresh token", 401);
      } else if (err.name === "TokenExpiredError") {
        throw new CustomErr("Refresh token expired", 401);
      }
      throw new CustomErr("Token verification failed", 401);
    }

    // Find user and verify the refresh token matches what's stored in database
    const user = await User.findById(decoded.userId);
    if (!user || user.refresh_token !== refreshToken) {
      throw new CustomErr("Invalid refresh token", 401);
    }

    // Generate new access token (short-lived)
    const newAccessToken = Jwt.sign({ userId: user._id }, tokenConfig.access, {
      expiresIn: "1h",
    });

    // Rotate refresh token (best practice)
    const newRefreshToken = Jwt.sign(
      { userId: user._id },
      tokenConfig.refresh,
      { expiresIn: "30d" }
    );

    // Update refresh token in database
    user.refresh_token = newRefreshToken;
    await user.save();

    const isProd = process.env.NODE_ENV === "production";

    // Set new access token cookie
    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    // Set new refresh token cookie
    res.cookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.status(200).json({
      message: "Token refreshed successfully",
      access_token: newAccessToken,
    });
  } catch (err) {
    return next(err);
  }
};





