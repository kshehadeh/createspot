/**
 * Utilities for extracting and managing critique selection fragments
 */

import { loadImageToCanvas } from "./image-editor/canvas-utils";
import { cropImage } from "./image-editor/crop";

export interface ImageSelection {
  type: "image";
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
  width: number; // Percentage (0-100)
  height: number; // Percentage (0-100)
  fragmentUrl: string;
}

export interface TextSelection {
  type: "text";
  startIndex: number;
  endIndex: number;
  originalText: string;
}

export type SelectionData = ImageSelection | TextSelection;

// Temporary selection data before upload (for UI)
export interface ImageSelectionInput {
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextSelectionInput {
  type: "text";
  startIndex: number;
  endIndex: number;
  originalText: string;
}

export type SelectionDataInput = ImageSelectionInput | TextSelectionInput;

/**
 * Extract an image fragment from a selection area
 * @param imageUrl The source image URL
 * @param selection Selection coordinates as percentages (0-100) relative to actual image
 * @returns Base64 data URL of the cropped image
 */
export async function extractImageFragment(
  imageUrl: string,
  selection: { x: number; y: number; width: number; height: number },
): Promise<string> {
  // Load image to canvas
  const canvas = await loadImageToCanvas(imageUrl);
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // Selection percentages are now directly relative to actual image dimensions
  let x = Math.round((selection.x / 100) * imgWidth);
  let y = Math.round((selection.y / 100) * imgHeight);
  let width = Math.round((selection.width / 100) * imgWidth);
  let height = Math.round((selection.height / 100) * imgHeight);

  // Ensure minimum size
  const MIN_SIZE = 20;
  const finalWidth = Math.max(width, MIN_SIZE);
  const finalHeight = Math.max(height, MIN_SIZE);

  // Ensure coordinates are within bounds
  const finalX = Math.max(0, Math.min(x, imgWidth - finalWidth));
  const finalY = Math.max(0, Math.min(y, imgHeight - finalHeight));

  // Crop the image
  const croppedCanvas = cropImage(canvas, {
    x: finalX,
    y: finalY,
    width: finalWidth,
    height: finalHeight,
  });

  // Convert to base64 data URL
  return croppedCanvas.toDataURL("image/webp", 0.85);
}

/**
 * Extract text selection from HTML content
 * @param htmlText The HTML text content
 * @param startIndex Character index where selection starts
 * @param endIndex Character index where selection ends
 * @returns The selected text (plain text, not HTML)
 */
export function extractTextSelection(
  htmlText: string,
  startIndex: number,
  endIndex: number,
): string {
  // Create a temporary element to extract text content
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlText;

  // Get plain text content
  const plainText = tempDiv.textContent || tempDiv.innerText || "";

  // Extract the selected portion
  const selectedText = plainText.slice(startIndex, endIndex);

  return selectedText;
}
