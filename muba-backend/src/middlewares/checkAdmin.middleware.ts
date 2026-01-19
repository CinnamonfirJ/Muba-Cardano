import express from "express";
import type { NextFunction, Request, Response } from "express";
import User from "../models/users.model.ts";
import jwtPkg from "jsonwebtoken";
const Jwt = jwtPkg;
import { tokenConfig } from "../../config/index.ts";

export const CheckAdmin = async (req: Request, res: Response, next: NextFunction) => {
    // const { owner } = req.body;
    const token = req.cookies.access_token;

    try {
        if (!token) {
            return res.status(401).json({ message: "UnAuthorized, Only Admins can perform this action" })
        }

        const decoded = Jwt.verify(token, tokenConfig.access);

        let userId: string | undefined;
        if (typeof decoded === "object" && "userId" in decoded) {
            userId = (decoded as { userId: string }).userId;
        }

        if (!userId) {
            return res.status(401).json({ message: "Invalid token payload" });
        }

        const owner = await User.findById(userId);

        if (owner._id) {
            const store_owner = await User.findById(owner._id);
            if (!store_owner) {
                return res.status(404).json({ message: "User not Registered" });
            }
            if (store_owner.role !== "admin") {
                return res.status(401).json({ message: "You're not an Admin"});
            }
        }

        next();
    } catch (err) {
        return res.status(500).json({ message: `Internal Server Error: ${err}`});
    }
}




