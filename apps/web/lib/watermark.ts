import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

export type WatermarkPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";

interface WatermarkOptions {
  position: WatermarkPosition;
  /** Opacity of the watermark (0-1). Default: 0.5 */
  opacity?: number;
  /** Size of watermark as percentage of image's shorter dimension. Default: 0.12 (12%) */
  sizeRatio?: number;
  /** Margin from edge as percentage of watermark size. Default: 0.15 (15%) */
  marginRatio?: number;
}

/**
 * Creates a semi-transparent watermark SVG with the CreateSpot logo
 */
async function createWatermarkSvg(
  size: number,
  opacity: number,
): Promise<Buffer> {
  // Read the white logo SVG
  const logoPath = path.join(
    process.cwd(),
    "marketing/createspot-logo-white.svg",
  );
  let logoSvg: string;

  try {
    logoSvg = await fs.readFile(logoPath, "utf-8");
  } catch {
    // Fallback to a simple text-based watermark if logo not found
    const fallbackSvg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <text 
          x="50%" 
          y="50%" 
          font-family="system-ui, sans-serif" 
          font-size="${size * 0.15}" 
          font-weight="bold"
          fill="white" 
          fill-opacity="${opacity}"
          text-anchor="middle" 
          dominant-baseline="middle"
        >CreateSpot</text>
      </svg>
    `;
    return Buffer.from(fallbackSvg);
  }

  // Parse the original viewBox to maintain aspect ratio
  const viewBoxMatch = logoSvg.match(/viewBox="([^"]+)"/);
  const originalViewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 729 796";
  const [, , origWidth, origHeight] = originalViewBox.split(" ").map(Number);

  // Calculate dimensions maintaining aspect ratio
  const aspectRatio = origWidth / origHeight;
  let width: number;
  let height: number;

  if (aspectRatio > 1) {
    width = size;
    height = size / aspectRatio;
  } else {
    height = size;
    width = size * aspectRatio;
  }

  // Modify the SVG to apply opacity and resize
  // Replace the fill colors with semi-transparent versions
  let modifiedSvg = logoSvg
    .replace(/width="[^"]*"/, `width="${Math.round(width)}"`)
    .replace(/height="[^"]*"/, `height="${Math.round(height)}"`)
    // Add opacity to the main group
    .replace(/<g id="White">/, `<g id="White" opacity="${opacity}">`);

  return Buffer.from(modifiedSvg);
}

/**
 * Applies a watermark with margin by creating a padded composite
 */
export async function applyWatermarkWithMargin(
  imageBuffer: Buffer,
  options: WatermarkOptions,
): Promise<Buffer> {
  const {
    position,
    opacity = 0.5,
    sizeRatio = 0.12,
    marginRatio = 0.2,
  } = options;

  // Get image metadata
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to read image dimensions");
  }

  // Calculate watermark size based on the shorter dimension
  const shorterDimension = Math.min(metadata.width, metadata.height);
  const watermarkSize = Math.round(shorterDimension * sizeRatio);
  const margin = Math.round(watermarkSize * marginRatio);

  // Create the watermark SVG
  const watermarkBuffer = await createWatermarkSvg(watermarkSize, opacity);

  // Resize the watermark
  const resizedWatermark = await sharp(watermarkBuffer)
    .resize(watermarkSize, watermarkSize, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  // Get the actual watermark dimensions after resize
  const wmMetadata = await sharp(resizedWatermark).metadata();
  const wmWidth = wmMetadata.width || watermarkSize;
  const wmHeight = wmMetadata.height || watermarkSize;

  // Calculate top/left position based on position string
  let top: number;
  let left: number;

  switch (position) {
    case "top-left":
      top = margin;
      left = margin;
      break;
    case "top-right":
      top = margin;
      left = metadata.width - wmWidth - margin;
      break;
    case "bottom-left":
      top = metadata.height - wmHeight - margin;
      left = margin;
      break;
    case "bottom-right":
    default:
      top = metadata.height - wmHeight - margin;
      left = metadata.width - wmWidth - margin;
      break;
  }

  // Composite the watermark onto the image with explicit positioning
  const result = await image
    .composite([
      {
        input: resizedWatermark,
        top: Math.max(0, Math.round(top)),
        left: Math.max(0, Math.round(left)),
      },
    ])
    .toBuffer();

  return result;
}

/**
 * Validates if a position string is a valid watermark position
 */
export function isValidWatermarkPosition(
  position: string,
): position is WatermarkPosition {
  return ["bottom-right", "bottom-left", "top-right", "top-left"].includes(
    position,
  );
}
