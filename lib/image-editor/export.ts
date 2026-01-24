/**
 * Convert canvas to Blob
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number = 0.9,
  mimeType: string = "image/jpeg",
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      },
      mimeType,
      quality,
    );
  });
}

/**
 * Convert canvas to File
 */
export async function canvasToFile(
  canvas: HTMLCanvasElement,
  filename: string,
  quality: number = 0.9,
  mimeType: string = "image/jpeg",
): Promise<File> {
  const blob = await canvasToBlob(canvas, quality, mimeType);
  return new File([blob], filename, { type: mimeType });
}

/**
 * Get MIME type from file extension or URL
 */
export function getMimeTypeFromSource(source: string): string {
  const extension = source.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
}
