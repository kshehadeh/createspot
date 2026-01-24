import { createCanvas, getImageData, putImageData } from "../canvas-utils";

/**
 * Apply shadow recovery to lighten dark areas (0-100)
 * Higher values lighten shadows more
 */
export function applyShadowRecovery(
  canvas: HTMLCanvasElement,
  amount: number,
): HTMLCanvasElement {
  const shadowAmount = Math.max(0, Math.min(100, amount)) / 100;

  const imageData = getImageData(canvas);
  const data = imageData.data;

  // Process each pixel
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Calculate luminance (perceived brightness)
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    // If pixel is dark (shadow), lighten it
    if (luminance < 128) {
      // Calculate how much to lighten based on how dark it is
      const darkness = 1 - luminance / 128;
      const lightenAmount = shadowAmount * darkness * 0.5; // Max 50% lightening

      data[i] = Math.min(255, r + (255 - r) * lightenAmount);
      data[i + 1] = Math.min(255, g + (255 - g) * lightenAmount);
      data[i + 2] = Math.min(255, b + (255 - b) * lightenAmount);
    }
  }

  const newCanvas = createCanvas(canvas.width, canvas.height);
  putImageData(newCanvas, imageData);
  return newCanvas;
}

/**
 * Apply highlight recovery to darken bright areas (0-100)
 * Higher values darken highlights more
 */
export function applyHighlightRecovery(
  canvas: HTMLCanvasElement,
  amount: number,
): HTMLCanvasElement {
  const highlightAmount = Math.max(0, Math.min(100, amount)) / 100;

  const imageData = getImageData(canvas);
  const data = imageData.data;

  // Process each pixel
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Calculate luminance (perceived brightness)
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    // If pixel is bright (highlight), darken it
    if (luminance > 128) {
      // Calculate how much to darken based on how bright it is
      const brightness = (luminance - 128) / 128;
      const darkenAmount = highlightAmount * brightness * 0.5; // Max 50% darkening

      data[i] = Math.max(0, r - r * darkenAmount);
      data[i + 1] = Math.max(0, g - g * darkenAmount);
      data[i + 2] = Math.max(0, b - b * darkenAmount);
    }
  }

  const newCanvas = createCanvas(canvas.width, canvas.height);
  putImageData(newCanvas, imageData);
  return newCanvas;
}

/**
 * Apply both shadow and highlight recovery
 */
export function applyShadowsHighlights(
  canvas: HTMLCanvasElement,
  shadows: number,
  highlights: number,
): HTMLCanvasElement {
  let processed = canvas;
  if (shadows > 0) {
    processed = applyShadowRecovery(processed, shadows);
  }
  if (highlights > 0) {
    processed = applyHighlightRecovery(processed, highlights);
  }
  return processed;
}
