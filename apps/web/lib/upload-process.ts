import sharp from "sharp";

export interface ProcessImageForStorageOptions {
  maxLongEdge?: number;
  webpQuality?: number;
}

export interface ProcessImageForStorageResult {
  buffer: Buffer;
  contentType: string;
  extension: string;
}

const DEFAULT_MAX_LONG_EDGE = 2048;
const DEFAULT_WEBP_QUALITY = 85;

/**
 * Process an image for storage: resize (long edge ≤ maxLongEdge), convert to WebP,
 * or pass through GIF unchanged. Used by the upload workflow and submission image-replace.
 */
export async function processImageForStorage(
  buffer: Buffer,
  options?: ProcessImageForStorageOptions,
): Promise<ProcessImageForStorageResult> {
  const maxLongEdge = options?.maxLongEdge ?? DEFAULT_MAX_LONG_EDGE;
  const webpQuality = options?.webpQuality ?? DEFAULT_WEBP_QUALITY;

  const image = sharp(buffer);
  const metadata = await image.metadata();
  const format = metadata.format;

  // GIF: pass through unchanged (animations, compatibility)
  if (format === "gif") {
    return {
      buffer,
      contentType: "image/gif",
      extension: "gif",
    };
  }

  // JPEG (Sharp may report as "jpg" or "jpeg"), PNG, WebP: resize and convert to WebP
  if (
    format === "jpeg" ||
    format === "jpg" ||
    format === "png" ||
    format === "webp"
  ) {
    const resized = await image
      .resize(maxLongEdge, maxLongEdge, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: webpQuality })
      .toBuffer();

    return {
      buffer: resized,
      contentType: "image/webp",
      extension: "webp",
    };
  }

  // Unknown format: treat as pass-through with original buffer and best-guess extension
  const ext = (format ?? "webp") as string;
  return {
    buffer: await image.toBuffer(),
    contentType: metadata.format ? `image/${metadata.format}` : "image/webp",
    extension: ext === "jpeg" ? "jpg" : ext,
  };
}
