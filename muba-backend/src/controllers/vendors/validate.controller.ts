import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import express from "express";
import type { Request, Response } from "express";
import Users from "../../models/users.model.ts";
import fs from "node:fs";
import path from "node:path";
import type { SendEmailTypes } from "../../dto/email.dto.ts";
import { SendEmail } from "../../utils/sendEmail.utils.ts";
import RequestVendor from "../../models/requestVendor.model.ts";

export const ValidateVendor = async (req: Request, res: Response) => {
  const {
    firstname,
    email,
    address,
    matric_number,
    department,
    faculty,
    valid_id,
    picture,
    cac,
  } = req.body;

  try {
    const checkUser = await Users.findOne({ email });
    if (!checkUser) {
      return res
        .status(400)
        .json({ message: "user not registered in the database" });
    }

    await Users.findOneAndUpdate(
      { email },
      {
        address,
        matric_number,
        department,
        faculty,
        valid_id,
        picture,
        cac,
        vendorStatus: "accepted",
        role: "vendor",
      },
      { new: true, runValidators: true }
    );

    await RequestVendor.findOneAndDelete({ email });

    const template = fs.readFileSync(
      path.join(__dirname, "../../emailTemplates/kyc.email.html"),
      "utf-8"
    );
    const msg = template.replace("{{user_name}}", firstname);
    const emailData: SendEmailTypes = {
      email,
      title: `KYC Verified`,
      html: msg,
    };
    await SendEmail(emailData);

    return res.status(201).json({
      message: "User Verified Successfully",
    });
  } catch (err) {
    console.log(`Internal Server Error: ${err}`);
    return res.status(500).json({ message: `Internal Server Error ${err}` });
  }
};





