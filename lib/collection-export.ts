/**
 * Utility functions for collection export functionality
 */

/**
 * Convert HTML text to plain text by stripping HTML tags
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/**
 * Fetch an image from a URL and return it as a Buffer
 */
export async function fetchImageBuffer(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Sanitize a filename by removing invalid characters
 * Used for ZIP folder names and file names
 */
export function sanitizeFilename(name: string): string {
  // Remove or replace invalid characters for file/folder names
  // Windows: < > : " / \ | ? *
  // Unix: / and null
  return name
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\.\./g, "")
    .replace(/^\.+/, "")
    .trim()
    .substring(0, 255); // Limit length
}

/**
 * Get file extension from URL or default to jpg
 */
export function getImageExtension(imageUrl: string): string {
  const match = imageUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  const ext = match ? match[1].toLowerCase() : "jpg";
  // Normalize common extensions
  if (ext === "jpeg") return "jpg";
  return ext;
}
