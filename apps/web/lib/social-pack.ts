/**
 * Social media pack: platform-sized image variants and caption builder
 * for collection export (Instagram, Twitter).
 */

import sharp from "sharp";
import { stripHtml } from "@/lib/collection-export";

export interface PlatformPreset {
  id: string;
  width: number;
  height: number;
}

export const SOCIAL_PLATFORM_PRESETS: PlatformPreset[] = [
  { id: "instagram_square", width: 1080, height: 1080 },
  { id: "instagram_portrait", width: 1080, height: 1350 },
  { id: "twitter", width: 1200, height: 675 },
];

const JPEG_QUALITY = 90;

/**
 * Generate platform-sized image variants with cover crop.
 * Uses imageFocalPoint (0-100 x,y) to center the crop when provided; otherwise center.
 * Returns a Map of variant id -> JPEG buffer.
 */
export async function generateSocialVariants(
  imageBuffer: Buffer,
  focalPoint?: { x: number; y: number } | null,
): Promise<Map<string, Buffer>> {
  const results = new Map<string, Buffer>();
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const srcWidth = metadata.width ?? 0;
  const srcHeight = metadata.height ?? 0;

  if (srcWidth <= 0 || srcHeight <= 0) {
    return results;
  }

  const centerX = focalPoint ? (focalPoint.x / 100) * srcWidth : srcWidth / 2;
  const centerY = focalPoint ? (focalPoint.y / 100) * srcHeight : srcHeight / 2;

  for (const preset of SOCIAL_PLATFORM_PRESETS) {
    const { width: tw, height: th, id } = preset;
    const targetAspect = tw / th;
    const srcAspect = srcWidth / srcHeight;

    let cropWidth: number;
    let cropHeight: number;

    if (srcAspect >= targetAspect) {
      cropHeight = srcHeight;
      cropWidth = Math.round(srcHeight * targetAspect);
    } else {
      cropWidth = srcWidth;
      cropHeight = Math.round(srcWidth / targetAspect);
    }

    const left = Math.max(
      0,
      Math.min(srcWidth - cropWidth, Math.round(centerX - cropWidth / 2)),
    );
    const top = Math.max(
      0,
      Math.min(srcHeight - cropHeight, Math.round(centerY - cropHeight / 2)),
    );

    const cropped = await image
      .clone()
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .resize(tw, th)
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();

    results.set(id, cropped);
  }

  return results;
}

export interface CaptionInput {
  title: string | null;
  text: string | null;
  prompt?: { word1: string; word2: string; word3: string } | null;
}

export interface CaptionCreator {
  name: string | null;
  slug: string | null;
  id: string;
}

/**
 * Build caption text for a submission: title, plain-text description,
 * credit line (creator name + link to submission on Create Spot), optional prompt words.
 */
export function buildCaptionText(
  submission: CaptionInput,
  creator: CaptionCreator,
  submissionId: string,
  baseUrl: string,
): string {
  const lines: string[] = [];

  lines.push(submission.title || "Untitled");
  lines.push("");

  if (submission.text) {
    lines.push(stripHtml(submission.text));
    lines.push("");
  }

  const creatorSegment = creator.name || "Creator";
  const creatorPath = creator.slug
    ? `/creators/${creator.slug}`
    : `/creators/${creator.id}`;
  const submissionPath = `${creatorPath}/s/${submissionId}`;
  const viewUrl = `${baseUrl.replace(/\/$/, "")}${submissionPath}`;
  lines.push(`${creatorSegment} — View on Create Spot: ${viewUrl}`);
  lines.push("");

  if (
    submission.prompt?.word1 &&
    submission.prompt?.word2 &&
    submission.prompt?.word3
  ) {
    lines.push(
      `Prompt: ${submission.prompt.word1}, ${submission.prompt.word2}, ${submission.prompt.word3}`,
    );
  }

  return lines.join("\n").trim();
}
