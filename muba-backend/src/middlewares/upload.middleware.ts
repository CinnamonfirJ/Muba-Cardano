import multerPkg from "multer";
const multer = multerPkg;
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary (this is the only config needed)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage(); // keeps files in memory for Cloudinary

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// Helper function to upload buffer to Cloudinary and return URL string
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string = "vendor-documents"
): Promise<string> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "image",
          folder: folder,
          format: "jpg",
          quality: "auto",
          fetch_format: "auto",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            // Return only the secure URL as a string
            resolve(result!.secure_url);
          }
        }
      )
      .end(buffer);
  });
};

// Helper function to delete image from Cloudinary
export const deleteFromCloudinary = (publicId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error("Cloudinary delete error:", error);
        reject(error);
      } else {
        console.log("Cloudinary delete result:", result);
        resolve(result);
      }
    });
  });
};
