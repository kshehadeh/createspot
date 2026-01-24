/**
 * Canvas utility functions for image processing
 */

/**
 * Create a canvas with proper settings
 */
export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Load an image from URL and draw it to a canvas
 */
export async function loadImageToCanvas(
  url: string,
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Get ImageData from canvas for pixel manipulation
 */
export function getImageData(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Put ImageData back to canvas
 */
export function putImageData(
  canvas: HTMLCanvasElement,
  imageData: ImageData,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Create a new canvas from an existing canvas (copy)
 */
export function copyCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const newCanvas = createCanvas(canvas.width, canvas.height);
  const ctx = newCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }
  ctx.drawImage(canvas, 0, 0);
  return newCanvas;
}
