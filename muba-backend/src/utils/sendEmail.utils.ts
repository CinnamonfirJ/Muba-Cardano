import { emailConfig } from "../../config/index.ts";
import type { SendEmailTypes } from "../dto/email.dto.ts";
import nodemailer from "nodemailer"

export const SendEmail = async ({ email, title, html }: SendEmailTypes) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        port: 587,
        secure: false,
        auth: {
            user: emailConfig.email,
            pass: emailConfig.pass
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
    });

    const mailOptions = {
        from: emailConfig.email,
        to: email,
        subject: title,
        html
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (err) {
        console.error("Email sending failed:", err);
        // We throw the error so the caller can decide how to handle it, 
        // or we return a failed status. For now, let's return null to indicate failure.
        return null;
    }
}



