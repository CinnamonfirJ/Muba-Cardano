import { Request, Response } from "express";
import User from "../../models/users.model";
import { SendEmailTypes } from "../../dto/email.dto";
import { SendEmail } from "../../utils/sendEmail.utils";
import fs from "node:fs";
import path from "node:path";

// Get Pending Post Office Applications
export const GetPendingPostOfficeApplications = async (req: Request, res: Response) => {
    try {
        const applications = await User.find({ postOfficeStatus: "pending" })
            .select("-password -refresh_token");
        
        return res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });
    } catch (error) {
        return res.status(500).json({ message: `Error fetching applications: ${error}` });
    }
};

// Approve Post Office Application
export const ApprovePostOfficeApplication = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.postOfficeStatus !== "pending") {
            return res.status(400).json({ message: "User is not a pending applicant" });
        }

        user.postOfficeStatus = "accepted";
        user.role = "post_office"; // Activates the role
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Post Office application approved",
            data: user
        });

    } catch (error) {
        return res.status(500).json({ message: `Error approving application: ${error}` });
    }
};

// Reject Post Office Application
export const RejectPostOfficeApplication = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.postOfficeStatus = "rejected";
        // Do not change role
        await user.save();

        // Send Rejection Email
        try {
            const emailContent = `
                <h2>Post Office Application Update</h2>
                <p>Hello ${user.firstname},</p>
                <p>Unfortunately, your application to become a Campus Post Office has not been approved at this time.</p>
                <p><strong>Reason:</strong> ${reason || "Application did not meet requirements"}</p>
                <p>You can submit a new application after addressing the issues mentioned above.</p>
                <p>Best regards,<br>The MUBAXPRESS Team</p>
            `;

            const emailData: SendEmailTypes = {
                email: user.email,
                title: `Post Office Application Update`,
                html: emailContent,
            };
            await SendEmail(emailData);
        } catch (emailError) {
             console.error("Failed to send rejection email:", emailError);
        }

        return res.status(200).json({
            success: true,
            message: "Post Office application rejected",
            data: user
        });

    } catch (error) {
        return res.status(500).json({ message: `Error rejecting application: ${error}` });
    }
};
