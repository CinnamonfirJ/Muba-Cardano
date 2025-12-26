import { emailConfig } from "../../config";
import { SendEmailTypes } from "../dto/email.dto";
import nodemailer from "nodemailer"

export const SendEmail = async ({ email, title, html }: SendEmailTypes) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: emailConfig.email,
            pass: emailConfig.pass
        }
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