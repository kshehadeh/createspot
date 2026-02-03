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
 *
 * This function includes retry logic with cache-busting to handle intermittent
 * CORS issues caused by Cloudflare CDN caching responses without CORS headers.
 * When an image is first loaded without crossOrigin, the cached response may
 * lack Access-Control-Allow-Origin headers. Retrying with a cache-busting
 * parameter forces a fresh request that includes proper CORS headers.
 */
export async function loadImageToCanvas(
  url: string,
  maxRetries: number = 3,
): Promise<HTMLCanvasElement> {
  const attemptLoad = (
    urlToLoad: string,
    attempt: number,
  ): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        // Use naturalWidth/naturalHeight to ensure we get the actual image dimensions
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };

      img.onerror = () => {
        if (attempt < maxRetries) {
          // Retry with a cache-busting parameter to bypass CDN cached response
          // that may lack CORS headers (common with Cloudflare)
          const cacheBustUrl = addCacheBustParam(url, attempt);
          resolve(attemptLoad(cacheBustUrl, attempt + 1));
        } else {
          reject(
            new Error(
              `Failed to load image after ${maxRetries} attempts. This may be a CORS configuration issue.`,
            ),
          );
        }
      };

      img.src = urlToLoad;
    });
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
