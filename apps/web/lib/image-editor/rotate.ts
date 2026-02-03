import { createCanvas } from "./canvas-utils";

/**
 * Rotate an image canvas by the specified angle (in degrees)
 */
export function rotateImage(
  canvas: HTMLCanvasElement,
  angle: number,
): HTMLCanvasElement {
  // Normalize angle to 0-360 range
  const normalizedAngle = ((angle % 360) + 360) % 360;

  // Convert to radians
  const radians = (normalizedAngle * Math.PI) / 180;

  // Calculate new dimensions
  const { width, height } = getRotatedDimensions(
    canvas.width,
    canvas.height,
    normalizedAngle,
  );

  const rotatedCanvas = createCanvas(width, height);
  const ctx = rotatedCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Translate to center of new canvas
  ctx.translate(width / 2, height / 2);
  // Rotate
  ctx.rotate(radians);
  // Draw image centered
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

  return rotatedCanvas;
}

/**
 * Rotate image 90 degrees clockwise or counterclockwise
 */
export function rotate90(
  canvas: HTMLCanvasElement,
  clockwise: boolean = true,
): HTMLCanvasElement {
  const angle = clockwise ? 90 : -90;
  return rotateImage(canvas, angle);
}

/**
 * Calculate dimensions after rotation
 */
function getRotatedDimensions(
  width: number,
  height: number,
  angle: number,
): { width: number; height: number } {
  // Normalize angle to 0-360 range
  const normalizedAngle = ((angle % 360) + 360) % 360;

  // For 90 and 270 degrees, swap width and height
  if (normalizedAngle === 90 || normalizedAngle === 270) {
    return { width: height, height: width };
  }

  // For 0 and 180 degrees, dimensions stay the same
  if (normalizedAngle === 0 || normalizedAngle === 180) {
    return { width, height };
  }

  // For arbitrary angles, calculate using rotation matrix
  const radians = (normalizedAngle * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));

  return {
    width: width * cos + height * sin,
    height: width * sin + height * cos,
  };
}
