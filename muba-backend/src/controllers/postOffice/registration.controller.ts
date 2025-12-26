import { Request, Response } from "express";
import User from "../../models/users.model";

// Apply to become a Post Office
export const RegisterAsPostOffice = async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { postOfficeName, documents } = req.body;

    try {
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const existingUser = await User.findById(user._id);
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if (existingUser.postOfficeStatus === "pending" || existingUser.postOfficeStatus === "accepted") {
             return res.status(400).json({ message: "Application already pending or accepted" });
        }

        existingUser.postOfficeStatus = "pending";
        existingUser.postOfficeName = postOfficeName;
        if (documents) {
            existingUser.postOfficeDocs = documents;
        }

        await existingUser.save();

        return res.status(200).json({ 
            message: "Post Office application submitted successfully",
            data: existingUser 
        });

    } catch (error) {
        return res.status(500).json({ message: `Error submitting application: ${error}` });
    }
};
