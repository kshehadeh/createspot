import sharp from "sharp";

/**
 * Fetches an image from a URL and returns it as a PNG data URL suitable for
 * next/og ImageResponse (Satori). Handles WebP and other formats by converting
 * to PNG, and applies EXIF rotation.
 * Use when the image is displayed at natural size (e.g. in a scaled img).
 */
export async function fetchImageAsPngDataUrl(
  url: string,
): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pngBuffer = await sharp(buffer).rotate().png().toBuffer();
    const base64 = pngBuffer.toString("base64");
    return `data:image/png;base64,${base64}`;
  } catch {
    return null;
  }
}

export interface OgImageOptions {
  width: number;
  height: number;
  /** Focal point in 0–100 (percent). Crop is centered on this point. */
  focalPoint?: { x: number; y: number } | null;
}

/**
 * Fetches an image, optionally crops around a focal point, resizes to the
 * given dimensions, and returns a PNG data URL for next/og ImageResponse.
 * Use for full-bleed OG images (single image or grid cells).
 */
export async function fetchImageAsPngDataUrlForOg(
  url: string,
  options: OgImageOptions,
): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const rotatedBuffer = await sharp(buffer).rotate().toBuffer();
    const metadata = await sharp(rotatedBuffer).metadata();
    const originalWidth = metadata.width ?? 1;
    const originalHeight = metadata.height ?? 1;

    const targetAspectRatio = options.width / options.height;
    const originalAspectRatio = originalWidth / originalHeight;
    const w = Math.round(options.width);
    const h = Math.round(options.height);

    let processedBuffer: Buffer;

    if (options.focalPoint?.x != null && options.focalPoint?.y != null) {
      let cropWidth: number;
      let cropHeight: number;
      if (originalAspectRatio > targetAspectRatio) {
        cropHeight = originalHeight;
        cropWidth = cropHeight * targetAspectRatio;
      } else {
        cropWidth = originalWidth;
        cropHeight = cropWidth / targetAspectRatio;
      }
      cropWidth = Math.min(cropWidth, originalWidth);
      cropHeight = Math.min(cropHeight, originalHeight);

      const focalX = (options.focalPoint.x / 100) * originalWidth;
      const focalY = (options.focalPoint.y / 100) * originalHeight;
      let left = focalX - cropWidth / 2;
      let top = focalY - cropHeight / 2;
      left = Math.max(0, Math.min(left, originalWidth - cropWidth));
      top = Math.max(0, Math.min(top, originalHeight - cropHeight));

      processedBuffer = await sharp(rotatedBuffer)
        .extract({
          left: Math.round(left),
          top: Math.round(top),
          width: Math.round(cropWidth),
          height: Math.round(cropHeight),
        })
        .resize(w, h, { fit: "cover" })
        .png()
        .toBuffer();
    } else {
      processedBuffer = await sharp(rotatedBuffer)
        .resize(w, h, { fit: "cover" })
        .png()
        .toBuffer();
    }

    const base64 = processedBuffer.toString("base64");
    return `data:image/png;base64,${base64}`;
  } catch {
    return null;
  }
}
