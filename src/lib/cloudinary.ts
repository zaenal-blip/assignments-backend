import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

console.log("[Cloudinary Config]", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? "EXISTS" : "MISSING",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "EXISTS" : "MISSING",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const cloudinaryUpload = async (filePath: string): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "tps-board/profiles",
      resource_type: "auto",
    });
    return result.secure_url;
  } catch (error) {
    console.error("[Cloudinary Upload Error]", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
};

export const cloudinaryUploadBuffer = (
  buffer: Buffer,
  folder: string = "tps-board/profiles"
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error) {
          console.error("[Cloudinary Buffer Upload Error]", error);
          reject(new Error("Failed to upload image buffer to Cloudinary"));
        } else {
          resolve(result!.secure_url);
        }
      }
    );
    uploadStream.end(buffer);
  });
};

export default cloudinary;
