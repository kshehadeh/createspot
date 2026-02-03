/**
 * Server-side utilities for managing critique fragments in R2
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * Upload an image fragment to R2
 * @param submissionId The submission ID
 * @param critiqueId The critique ID
 * @param imageData Base64 data URL of the image fragment
 * @returns Public URL of the uploaded fragment
 */
export async function uploadFragment(
  submissionId: string,
  critiqueId: string,
  imageData: string,
): Promise<string> {
  // Extract base64 data (remove data:image/webp;base64, prefix)
  const base64Data = imageData.split(",")[1];
  if (!base64Data) {
    throw new Error("Invalid image data format");
  }

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Data, "base64");

  // Process image (resize if needed, ensure WebP format)
  const processed = await sharp(buffer).webp({ quality: 85 }).toBuffer();

  // Generate file path
  const fileName = `fragments/${submissionId}/${critiqueId}.webp`;

  // Upload to R2
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: fileName,
      Body: processed,
      ContentType: "image/webp",
    }),
  );

  // Return public URL
  return `${process.env.R2_PUBLIC_URL}/${fileName}`;
}

/**
 * Delete a fragment from R2
 * @param fragmentUrl The public URL of the fragment
 */
export async function deleteFragment(fragmentUrl: string): Promise<void> {
  const publicUrlPrefix = process.env.R2_PUBLIC_URL;
  if (!publicUrlPrefix || !fragmentUrl.startsWith(publicUrlPrefix)) {
    throw new Error("Invalid fragment URL");
  }

  const key = fragmentUrl.slice(publicUrlPrefix.length + 1); // +1 for trailing slash

  // Only allow deletion of fragments
  if (!key.startsWith("fragments/")) {
    throw new Error("Invalid fragment path");
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    }),
  );
}
