import { Request, Response } from "express";
import Users from "../../models/users.model";
import { getOtp } from "../../utils/genOtp.urils";
import fs from "node:fs";
import path from "node:path";
import { SendEmailTypes } from "../../dto/email.dto";
import { SendEmail } from "../../utils/sendEmail.utils";
import { hash } from "../../utils/hash.utils";
import { validateOtp } from "../../utils/validateOtp.utils";

export const RequestOtp = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({message: "Email is Required"})
        }

        const user = await Users.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Email not found" });
        }

        validateOtp(user.otpExpire)

        // Generate secure token
        const token = getOtp();
        const hashedOtp = await hash(token.otp);

        user.otp = hashedOtp;
        user.otpExpires = token.otpExpire;
        await user.save();

        const template = fs.readFileSync(
            path.join(__dirname, "../../emailTemplates/otp.email.html"),
            "utf-8"
        );
        const msg = template.replace(/{{user_email}}/g, email).replace(/{{otp}}/g, token.otp);
        const emailData: SendEmailTypes = {
            email,
            title: `Reset Password Request`,
            html: msg
        }

        await SendEmail(emailData);

        return res.status(200).json({ message: "OTP has been sent to your email" });
    } catch (err) {
        console.error(`Error: ${err}`);
        return res.status(500).json({ error: `Internal Server Error`})
    }
}