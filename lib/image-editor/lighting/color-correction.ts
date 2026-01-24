import { createCanvas, getImageData, putImageData } from "../canvas-utils";

/**
 * Remove yellowing/amber color cast from image (0-100)
 * Higher values remove more yellowing
 */
export function removeYellowing(
  canvas: HTMLCanvasElement,
  amount: number,
): HTMLCanvasElement {
  const yellowAmount = Math.max(0, Math.min(100, amount)) / 100;

  const imageData = getImageData(canvas);
  const data = imageData.data;

  // Process each pixel
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Calculate yellow component (yellow = red + green, minus blue)
    // Yellow cast typically shows as high R+G relative to B
    const yellowComponent = (r + g) / 2 - b;

    // If pixel has yellow cast, reduce it
    if (yellowComponent > 0) {
      const yellowRatio = Math.min(1, yellowComponent / 128);
      const correction = yellowAmount * yellowRatio * 0.5; // Max 50% correction

      // Reduce yellow by decreasing red and green, slightly increasing blue
      data[i] = Math.max(0, Math.min(255, r - r * correction));
      data[i + 1] = Math.max(0, Math.min(255, g - g * correction));
      data[i + 2] = Math.max(
        0,
        Math.min(255, b + (255 - b) * correction * 0.3),
      );
    }
  }

  const newCanvas = createCanvas(canvas.width, canvas.height);
  putImageData(newCanvas, imageData);
  return newCanvas;
}

/**
 * Even out colors to make them more uniform (0-100)
 * Useful for grayscale images with color casts
 */
export function evenColors(
  canvas: HTMLCanvasElement,
  amount: number,
): HTMLCanvasElement {
  const evenAmount = Math.max(0, Math.min(100, amount)) / 100;

  const imageData = getImageData(canvas);
  const data = imageData.data;

  // First pass: calculate average color values
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let pixelCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
    pixelCount++;
  }

  const avgR = totalR / pixelCount;
  const avgG = totalG / pixelCount;
  const avgB = totalB / pixelCount;
  const avgLuminance = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;

  // Second pass: normalize colors toward average
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    // Calculate target RGB values based on luminance
    // Preserve relative brightness but normalize color channels
    const targetR = (luminance / avgLuminance) * avgR;
    const targetG = (luminance / avgLuminance) * avgG;
    const targetB = (luminance / avgLuminance) * avgB;

    // Blend between original and target based on amount
    data[i] = Math.max(0, Math.min(255, r + (targetR - r) * evenAmount));
    data[i + 1] = Math.max(0, Math.min(255, g + (targetG - g) * evenAmount));
    data[i + 2] = Math.max(0, Math.min(255, b + (targetB - b) * evenAmount));
  }

  const newCanvas = createCanvas(canvas.width, canvas.height);
  putImageData(newCanvas, imageData);
  return newCanvas;
}

/**
 * Remove color cast by analyzing and neutralizing dominant color cast
 */
export function removeColorCast(
  canvas: HTMLCanvasElement,
  amount: number,
): HTMLCanvasElement {
  const castAmount = Math.max(0, Math.min(100, amount)) / 100;

  const imageData = getImageData(canvas);
  const data = imageData.data;

  // Analyze color cast by comparing channel averages
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let pixelCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
    pixelCount++;
  }

  const avgR = totalR / pixelCount;
  const avgG = totalG / pixelCount;
  const avgB = totalB / pixelCount;
  const avgLuminance = (avgR + avgG + avgB) / 3;

  // Calculate color cast (deviation from neutral gray)
  const rCast = avgR - avgLuminance;
  const gCast = avgG - avgLuminance;
  const bCast = avgB - avgLuminance;

  // Apply correction to neutralize cast
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Reduce the cast proportionally
    data[i] = Math.max(0, Math.min(255, r - rCast * castAmount));
    data[i + 1] = Math.max(0, Math.min(255, g - gCast * castAmount));
    data[i + 2] = Math.max(0, Math.min(255, b - bCast * castAmount));
  }

  const newCanvas = createCanvas(canvas.width, canvas.height);
  putImageData(newCanvas, imageData);
  return newCanvas;
}

/**
 * Automatic color correction - detects and removes color casts
 * Specifically targets yellowing and other common color casts
 */
export function autoColorCorrection(
  canvas: HTMLCanvasElement,
): HTMLCanvasElement {
  // First, remove color cast
  let processed = removeColorCast(canvas, 80);

  // Then, remove yellowing specifically
  processed = removeYellowing(processed, 60);

  // Finally, even out colors slightly
  processed = evenColors(processed, 40);

  return processed;
}
