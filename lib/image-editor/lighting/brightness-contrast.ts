import { createCanvas } from "../canvas-utils";

/**
 * Apply brightness adjustment to canvas (-100 to +100)
 * Negative values darken, positive values brighten
 */
export function applyBrightness(
  canvas: HTMLCanvasElement,
  value: number,
): HTMLCanvasElement {
  // Clamp value to -100 to +100 range
  const brightness = Math.max(-100, Math.min(100, value));

  // Convert to multiplier (0 = black, 1 = original, 2 = white)
  const multiplier = 1 + brightness / 100;

  const newCanvas = createCanvas(canvas.width, canvas.height);
  const ctx = newCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Use canvas filter for better performance
  ctx.filter = `brightness(${multiplier})`;
  ctx.drawImage(canvas, 0, 0);

  return newCanvas;
}

/**
 * Apply contrast adjustment to canvas (-100 to +100)
 * Negative values reduce contrast, positive values increase contrast
 */
export function applyContrast(
  canvas: HTMLCanvasElement,
  value: number,
): HTMLCanvasElement {
  // Clamp value to -100 to +100 range
  const contrast = Math.max(-100, Math.min(100, value));

  // Convert to filter value (0 = no contrast, 1 = original, 2 = max contrast)
  const filterValue = 1 + contrast / 100;

  const newCanvas = createCanvas(canvas.width, canvas.height);
  const ctx = newCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  ctx.filter = `contrast(${filterValue})`;
  ctx.drawImage(canvas, 0, 0);

  return newCanvas;
}

/**
 * Apply both brightness and contrast adjustments
 */
export function applyBrightnessContrast(
  canvas: HTMLCanvasElement,
  brightness: number,
  contrast: number,
): HTMLCanvasElement {
  const brightnessAdjusted = applyBrightness(canvas, brightness);
  return applyContrast(brightnessAdjusted, contrast);
}
