import { createCanvas, getImageData, putImageData } from "../canvas-utils";

/**
 * Automatic shadow/highlight recovery algorithm
 * Analyzes image histogram and applies adaptive tone mapping
 */
export function autoEvenLighting(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const imageData = getImageData(canvas);
  const data = imageData.data;

  // Build histogram
  // oxlint-disable-next-line no-new-array
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    histogram[luminance]++;
  }

  // Find shadow and highlight thresholds
  const totalPixels = canvas.width * canvas.height;
  let shadowThreshold = 0;
  let highlightThreshold = 255;

  // Find 5th percentile (shadows)
  let cumulative = 0;
  for (let i = 0; i < 256; i++) {
    cumulative += histogram[i];
    if (cumulative >= totalPixels * 0.05) {
      shadowThreshold = i;
      break;
    }
  }

  // Find 95th percentile (highlights)
  cumulative = 0;
  for (let i = 255; i >= 0; i--) {
    cumulative += histogram[i];
    if (cumulative >= totalPixels * 0.05) {
      highlightThreshold = i;
      break;
    }
  }

  // Apply adaptive tone mapping
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    // Shadow recovery: lighten dark areas
    if (luminance < shadowThreshold) {
      const darkness = 1 - luminance / shadowThreshold;
      const lightenAmount = darkness * 0.4; // Max 40% lightening

      data[i] = Math.min(255, r + (255 - r) * lightenAmount);
      data[i + 1] = Math.min(255, g + (255 - g) * lightenAmount);
      data[i + 2] = Math.min(255, b + (255 - b) * lightenAmount);
    }
    // Highlight recovery: darken bright areas
    else if (luminance > highlightThreshold) {
      const brightness =
        (luminance - highlightThreshold) / (255 - highlightThreshold);
      const darkenAmount = brightness * 0.3; // Max 30% darkening

      data[i] = Math.max(0, r - r * darkenAmount);
      data[i + 1] = Math.max(0, g - g * darkenAmount);
      data[i + 2] = Math.max(0, b - b * darkenAmount);
    }
  }

  const newCanvas = createCanvas(canvas.width, canvas.height);
  putImageData(newCanvas, imageData);
  return newCanvas;
}
