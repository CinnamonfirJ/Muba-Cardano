import { emailConfig } from "../../config/index.ts";
import type { SendEmailTypes } from "../dto/email.dto.ts";
import nodemailer from "nodemailer"

export const SendEmail = async ({ email, title, html }: SendEmailTypes) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        port: 587,               // REQUIRED
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
        const mail = transporter.sendMail(mailOptions)
    } catch (err) {
        console.error(err);
        return err
    }
}



