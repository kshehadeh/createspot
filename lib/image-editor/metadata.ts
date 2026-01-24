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
    const img = new Image();

    img.onload = async () => {
      const metadata: ImageMetadata = {
        width: img.width,
        height: img.height,
        format: img.src.split(".").pop()?.toLowerCase() || "unknown",
      };

      // If source is a File, get additional metadata
      if (source instanceof File) {
        metadata.size = source.size;

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
      }

      resolve(metadata);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    if (source instanceof File) {
      const reader = new FileReader();
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
      img.crossOrigin = "anonymous";
      img.src = source;
    }
  });
}
