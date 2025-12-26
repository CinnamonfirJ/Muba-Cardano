import { NextFunction, Request, Response } from "express";
import User from "../models/users.model";
import Jwt from "jsonwebtoken";
import { tokenConfig } from "../../config";

export const CheckPostOffice = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.access_token;

    try {
        if (!token) {
            return res.status(401).json({ message: "Unauthorized, access denied" })
        }

        const decoded = Jwt.verify(token, tokenConfig.access);

        let userId: string | undefined;
        if (typeof decoded === "object" && "userId" in decoded) {
            userId = (decoded as { userId: string }).userId;
        }

        if (!userId) {
            return res.status(401).json({ message: "Invalid token payload" });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if user is Post Office or Po Member
        if (user.role === "post_office" || user.role === "post_office_member" || user.role === "admin") {
            // Admin is also allowed for debugging/management potentially, 
            // but strict requirement says "Only authorized...". 
            // Let's include admin for now or stick to strict roles. 
            // Prompt says: "Only authorized users with POST_OFFICE or POST_OFFICE_MEMBER role"
            // I will keep Admin out unless requested, but usually admin has override. 
            // Let's stick to the prompt: 
            if (user.role === "post_office" || user.role === "post_office_member") {
                 next(); 
            } else {
                return res.status(403).json({ message: "Access forbidden: Post Office Only" });
            }
        } else {
            return res.status(403).json({ message: "Access forbidden: Post Office Only" });
        }

    } catch (err) {
        return res.status(500).json({ message: `Internal Server Error: ${err}`});
    }
}
