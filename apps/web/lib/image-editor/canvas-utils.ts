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
 * Load an image from URL and draw it to a canvas, respecting EXIF orientation.
 *
 * Uses fetch + createImageBitmap({ imageOrientation: 'from-image' }) so that
 * EXIF orientation tags are always applied, avoiding the inconsistent canvas
 * behaviour of ctx.drawImage(imgElement) across browsers.
 *
 * Retries with cache-busting to handle intermittent Cloudflare CDN responses
 * that lack CORS headers.
 */
export async function loadImageToCanvas(
  url: string,
  maxRetries: number = 3,
): Promise<HTMLCanvasElement> {
  const attemptLoad = async (
    urlToLoad: string,
    attempt: number,
  ): Promise<HTMLCanvasElement> => {
    try {
      const response = await fetch(urlToLoad, { mode: "cors" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob, {
        imageOrientation: "from-image",
      });

      const canvas = createCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        bitmap.close();
        throw new Error("Failed to get canvas context");
      }
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      return canvas;
    } catch {
      if (attempt < maxRetries) {
        // Retry with a cache-busting parameter to bypass CDN cached response
        // that may lack CORS headers (common with Cloudflare)
        const cacheBustUrl = addCacheBustParam(url, attempt);
        return attemptLoad(cacheBustUrl, attempt + 1);
      }
      throw new Error(
        `Failed to load image after ${maxRetries} attempts. This may be a CORS configuration issue.`,
      );
    }
  };

  return attemptLoad(url, 1);
}

/**
 * Add a cache-busting parameter to bypass CDN cached responses without CORS headers
 */
function addCacheBustParam(url: string, attempt: number): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}_cb=${Date.now()}-${attempt}`;
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
