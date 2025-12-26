import { NextFunction, Request, Response } from "express";
import User from "../../models/users.model";
import bcrypt from "bcrypt";
import Jwt from "jsonwebtoken";
import { tokenConfig } from "../../../config";
import { CustomErr } from "../../utils/errors.utils";

export const SignIn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, matric_number, password } = req.body;

    const query: any[] = [{ email }];
    if (matric_number) {
      query.push({ matric_number });
    }

    const user = await User.findOne({ $or: query });
    if (!user) {
      throw new CustomErr("User not found", 400);
    }

    const verifyPassword = await bcrypt.compare(password, user.password);
    if (!verifyPassword) {
      throw new CustomErr("Incorrect Password", 400);
    }

    let refresh_token = user.refresh_token;

    try {
      Jwt.verify(user.refresh_token, tokenConfig.refresh);
    } catch (err) {
      refresh_token = Jwt.sign({ userId: user._id }, tokenConfig.refresh, {
        expiresIn: "30d",
      });
      user.refresh_token = refresh_token;
      await user.save();
    }

    const AccessToken = Jwt.sign({ userId: user._id }, tokenConfig.access, {
      expiresIn: "1hr",
    });

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refresh_token;

    // Always set secure to true in prod, and allow secure in dev if needed
    const isProd = process.env.NODE_ENV === "production";

    res.cookie("access_token", AccessToken, {
      httpOnly: true,
      secure: isProd ? true : false, // true in prod, false in local
      sameSite: isProd ? "none" : "lax", // "none" needed for cross-site
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: isProd ? true : false,
      sameSite: isProd ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.status(200).json({
      message: "Login Successfull",
      access_token: AccessToken,
      data: userObj,
    });
  } catch (err) {
    return next(err);
  }
};
