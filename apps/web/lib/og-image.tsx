import { ImageResponse } from "next/og";
import sharp from "sharp";

/** Standard OG image dimensions for next/og. */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

/** Standard OG image content type. */
export const OG_IMAGE_CONTENT_TYPE = "image/png";

/** Minimal submission shape needed to decide OG image visibility. */
export interface SubmissionVisibilityForOg {
  shareStatus: string;
  userId: string;
}

/**
 * Returns true if the submission can be shown in an OG image (public, profile, or owner).
 * Use in opengraph-image handlers so visibility logic stays in one place.
 */
export function canShowSubmissionForOg(
  submission: SubmissionVisibilityForOg | null,
  creatorId: string,
): submission is SubmissionVisibilityForOg {
  return (
    submission !== null &&
    (submission.shareStatus === "PUBLIC" ||
      submission.shareStatus === "PROFILE" ||
      submission.userId === creatorId)
  );
}

/**
 * Returns true if the submission can be shown in a public OG context (no owner),
 * i.e. only when shareStatus is PUBLIC or PROFILE. Use for exhibit/collection OG
 * when the viewer is not the submission owner.
 */
export function isSubmissionVisibleForPublicOg(
  submission: { shareStatus: string } | null,
): boolean {
  return (
    submission !== null &&
    (submission.shareStatus === "PUBLIC" ||
      submission.shareStatus === "PROFILE")
  );
}

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

/**
 * Returns an ImageResponse for "not found" OG images (shared gradient + centered text).
 */
export function createOgNotFoundResponse(message: string): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #ffffff 0%, #f4f4f5 100%)",
      }}
    >
      <div
        style={{
          fontSize: "48px",
          fontWeight: "bold",
          color: "#000000",
        }}
      >
        {message}
      </div>
    </div>,
    { ...OG_IMAGE_SIZE },
  );
}

/**
 * Returns an ImageResponse for a full-bleed image with no overlay.
 */
export function createOgFullBleedImageResponse(
  imageDataUrl: string,
  alt: string,
): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
      }}
    >
      <img
        src={imageDataUrl}
        alt={alt}
        width={OG_IMAGE_SIZE.width}
        height={OG_IMAGE_SIZE.height}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </div>,
    { ...OG_IMAGE_SIZE },
  );
}

/**
 * Returns an ImageResponse for a grid of images (no overlay).
 * Filters out nulls and lays out in a grid with maxCols (default 3).
 */
export function createOgGridImageResponse(
  imageDataUrls: (string | null)[],
  maxCols: number = 3,
): ImageResponse {
  const valid = imageDataUrls.filter((u): u is string => u !== null);
  if (valid.length === 0) {
    return createOgNotFoundResponse("No images");
  }
  const gridCols = Math.min(maxCols, valid.length);
  const cellWidth = OG_IMAGE_SIZE.width / gridCols;
  const cellHeight = OG_IMAGE_SIZE.height / Math.ceil(valid.length / gridCols);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        flexWrap: "wrap",
      }}
    >
      {valid.map((imageDataUrl, index) => {
        const row = Math.floor(index / gridCols);
        const col = index % gridCols;
        return (
          <img
            key={index}
            src={imageDataUrl}
            alt={`Image ${index + 1}`}
            width={cellWidth}
            height={cellHeight}
            style={{
              width: `${cellWidth}px`,
              height: `${cellHeight}px`,
              objectFit: "cover",
              position: "absolute",
              left: `${col * cellWidth}px`,
              top: `${row * cellHeight}px`,
            }}
          />
        );
      })}
    </div>,
    { ...OG_IMAGE_SIZE },
  );
}
