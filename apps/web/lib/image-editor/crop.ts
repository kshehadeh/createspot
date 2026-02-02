import { createCanvas } from "./canvas-utils";

/**
 * Crop area definition
 */
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Crop dimensions result
 */
export interface CropDimensions {
  width: number;
  height: number;
}

/**
 * Calculate crop dimensions from crop area
 */
export function getCropDimensions(
  cropArea: CropArea,
  imageSize: { width: number; height: number },
): CropDimensions {
  return {
    width: Math.min(cropArea.width, imageSize.width - cropArea.x),
    height: Math.min(cropArea.height, imageSize.height - cropArea.y),
  };
}

/**
 * Crop an image canvas to the specified area
 */
export function cropImage(
  canvas: HTMLCanvasElement,
  cropArea: CropArea,
): HTMLCanvasElement {
  const croppedCanvas = createCanvas(cropArea.width, cropArea.height);
  const ctx = croppedCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Draw the cropped portion
  ctx.drawImage(
    canvas,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height,
  );

  return croppedCanvas;
}
