import express from "express";
import type { Request, Response } from "express";
import Users from "../../models/users.model.ts";
import { hash } from "../../utils/hash.utils.ts";

export const ResetPassword = async (req: Request, res: Response) => {
  try {
    const { otp, newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({ message: "New Password is required" });
    }

    const user = await Users.findOne({
        otp,
        otpExpires: { $gt: new Date() },
    });

    if (!user) {
        return res.status(400).json({ message: "Invalid or expired otp" });
    }

    user.password = await hash(newPassword);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    return res.status(500).json({ error: `internal Server Error`});
  }
};


