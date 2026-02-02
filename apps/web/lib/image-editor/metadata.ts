/**
 * Image metadata structure
 */
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size?: number; // File size in bytes
  colorDepth?: number; // Bits per pixel
}

/**
 * Extract metadata from an image URL or File
 */
export async function getImageMetadata(
  source: string | File,
): Promise<ImageMetadata> {
  return new Promise((resolve, reject) => {
    if (source instanceof File) {
      const img = new Image();
      const reader = new FileReader();

      img.onload = async () => {
        const metadata: ImageMetadata = {
          width: img.width,
          height: img.height,
          format: img.src.split(".").pop()?.toLowerCase() || "unknown",
          size: source.size,
        };

        // Try to get color depth from canvas
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, 1, 1);
            // Most images are 24-bit (RGB) or 32-bit (RGBA)
            metadata.colorDepth = imageData.data.length === 4 ? 32 : 24;
          }
        } catch {
          // Ignore errors getting color depth
        }

        resolve(metadata);
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      reader.readAsDataURL(source);
    } else {
      // For URLs, try with crossOrigin first, then without if it fails
      // This handles both CORS-enabled and same-origin images
      const tryLoad = (useCrossOrigin: boolean) => {
        const img = new Image();

        img.onload = () => {
          const metadata: ImageMetadata = {
            width: img.width,
            height: img.height,
            format: source.split(".").pop()?.toLowerCase() || "unknown",
          };
          resolve(metadata);
        };

        img.onerror = () => {
          if (useCrossOrigin) {
            // Try again without crossOrigin for same-origin images
            tryLoad(false);
          } else {
            reject(new Error("Failed to load image"));
          }
        };

        if (useCrossOrigin) {
          img.crossOrigin = "anonymous";
        }
        img.src = source;
      };
      tryLoad(true);
    }
  });
}
