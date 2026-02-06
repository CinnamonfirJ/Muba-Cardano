import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// controllers/request.controller.ts
import express from "express";
import type { Request, Response } from "express";
import Users from "../../models/users.model.ts";
import RequestVendor from "../../models/requestVendor.model.ts";
import fs from "node:fs";
import path from "node:path";
import type { SendEmailTypes } from "../../dto/email.dto.ts";
import { SendEmail } from "../../utils/sendEmail.utils.ts";
import { uploadToCloudinary } from "../../middlewares/upload.middleware.ts";
import { isValidMatricNumber } from "../../utils/validation.util.ts";
import { eventBus, EVENTS } from "../../events/eventBus.ts";

export const RequestToBeVendor = async (req: Request, res: Response) => {
  try {
    const { firstname, email, address, matric_number, department, faculty } = req.body;

    const valid_id = (req.files as any)?.valid_id?.[0];
    const picture = (req.files as any)?.picture?.[0];
    const cac = (req.files as any)?.cac?.[0];

    // Validation
    if (!firstname || !email || !address || !valid_id || !picture || !matric_number) {
      return res.status(400).json({
        message: "Please Fill in Required Fields (including Matric Number)",
      });
    }

    if (!isValidMatricNumber(matric_number)) {
        return res.status(400).json({
            message: "Invalid Matriculation Number format. Expected format: U21CO1024"
        });
    }

    // Check if user exists
    const checkUser = await Users.findOne({ email });
    if (!checkUser) {
      return res.status(400).json({ message: "user not registered" });
    }

    // Check if user already has a pending application
    const existingApplication = await RequestVendor.findOne({
      email,
      status: { $in: ["pending", "approved"] },
    });

    if (existingApplication) {
      return res.status(400).json({
        message: `You already have a ${existingApplication.status} vendor application`,
      });
    }

    // Upload images to Cloudinary and get URL strings
    let valid_id_url: string;
    let picture_url: string;
    let cac_url: string | null = null;

    try {
      console.log("Uploading images to Cloudinary...");

      // Upload images sequentially to avoid overwhelming Cloudinary
      valid_id_url = await uploadToCloudinary(
        valid_id.buffer,
        "vendor-documents/valid-ids"
      );
      picture_url = await uploadToCloudinary(
        picture.buffer,
        "vendor-documents/pictures"
      );

      if (cac) {
        cac_url = await uploadToCloudinary(cac.buffer, "vendor-documents/cac");
      }

      console.log("Images uploaded successfully to Cloudinary");
      console.log("Valid ID URL:", valid_id_url);
      console.log("Picture URL:", picture_url);
      if (cac_url) console.log("CAC URL:", cac_url);
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      return res.status(500).json({
        message: "Failed to upload documents to cloud storage",
        error:
          uploadError instanceof Error ? uploadError.message : "Upload failed",
      });
    }

    // Find admin
    const getAdmin = await Users.findOne({ role: "admin" });
    if (!getAdmin) {
      return res.status(500).json({ message: "Admin not found" });
    }

    // Create vendor request with Cloudinary URL strings
    const newRequest = await RequestVendor.create({
      firstname,
      email,
      address,
      matric_number,
      department,
      faculty,
      valid_id: valid_id_url, // Store as URL string instead of buffer
      picture: picture_url, // Store as URL string instead of buffer
      cac: cac_url, // Store as URL string instead of buffer (or null)
      status: "pending",
    });

    // Update user vendor status
    await Users.findOneAndUpdate(
      { email },
      { vendorStatus: "pending" },
      { new: true, runValidators: true }
    );

    // Emit Event for Async Email Processing
    eventBus.emit(EVENTS.VENDOR.REQUEST_CREATED, {
        firstname,
        email,
        matric_number,
        department,
        faculty,
        valid_id: valid_id_url,
        picture: picture_url,
        cac: cac_url,
        adminEmail: getAdmin?.email
    });
    
    console.log(`[VendorRequest] Event ${EVENTS.VENDOR.REQUEST_CREATED} emitted for ${email}`);

    return res.status(201).json({
      message: "Request Sent Successfully",
      data: {
        id: newRequest._id,
        status: newRequest.status,
        documents_uploaded: {
          valid_id: !!valid_id_url,
          picture: !!picture_url,
          cac: !!cac_url,
        },
      },
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({
      message: `Internal Server Error: ${
        err instanceof Error ? err.message : "Unknown error"
      }`,
    });
  }
};
