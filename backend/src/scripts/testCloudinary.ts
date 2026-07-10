// Run this directly with: npx ts-node src/scripts/testCloudinary.ts
import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

cloudinary.uploader
  .upload("https://res.cloudinary.com/demo/image/upload/sample.jpg", {
    folder: "roadguard/test",
  })
  .then((result) => {
    console.log("SUCCESS - Cloudinary account and credentials are fine:");
    console.log(result.secure_url);
  })
  .catch((error) => {
    console.log("FAILED - here is the full error object:");
    console.log(JSON.stringify(error, null, 2));
  });