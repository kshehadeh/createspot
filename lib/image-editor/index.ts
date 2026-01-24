/**
 * Main image editor module - orchestrates all image processing operations
 */

import { loadImageToCanvas } from "./canvas-utils";
import { cropImage, type CropArea } from "./crop";
import { rotateImage, rotate90 } from "./rotate";
import {
  applyLightingAdjustments,
  autoEvenLighting,
  type LightingAdjustments,
} from "./lighting";
import { getImageMetadata, type ImageMetadata } from "./metadata";
import { canvasToBlob, canvasToFile, getMimeTypeFromSource } from "./export";

/**
 * Image operation types
 */
export type ImageOperation =
  | { type: "crop"; area: CropArea }
  | { type: "rotate"; angle: number }
  | { type: "rotate90"; clockwise: boolean }
  | { type: "lighting"; adjustments: LightingAdjustments }
  | { type: "autoEvenLighting" };

/**
 * Process an image with multiple operations
 */
export async function processImage(
  imageSource: string | HTMLImageElement | HTMLCanvasElement,
  operations: ImageOperation[],
): Promise<HTMLCanvasElement> {
  // Load image to canvas if needed
  let canvas: HTMLCanvasElement;

  if (typeof imageSource === "string") {
    canvas = await loadImageToCanvas(imageSource);
  } else if (imageSource instanceof HTMLImageElement) {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = imageSource.width;
    tempCanvas.height = imageSource.height;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }
    ctx.drawImage(imageSource, 0, 0);
    canvas = tempCanvas;
  } else {
    canvas = imageSource;
  }

  // Apply operations in sequence
  for (const operation of operations) {
    switch (operation.type) {
      case "crop":
        canvas = cropImage(canvas, operation.area);
        break;
      case "rotate":
        canvas = rotateImage(canvas, operation.angle);
        break;
      case "rotate90":
        canvas = rotate90(canvas, operation.clockwise);
        break;
      case "lighting":
        canvas = applyLightingAdjustments(canvas, operation.adjustments);
        break;
      case "autoEvenLighting":
        canvas = autoEvenLighting(canvas);
        break;
    }
  }

  return canvas;
}

/**
 * Apply multiple image operations efficiently
 * This is an alias for processImage for clarity
 */
export async function applyImageOperations(
  imageSource: string | HTMLImageElement | HTMLCanvasElement,
  operations: ImageOperation[],
): Promise<HTMLCanvasElement> {
  return processImage(imageSource, operations);
}

// Re-export all public functions and types
export {
  loadImageToCanvas,
  createCanvas,
  getImageData,
  putImageData,
} from "./canvas-utils";
export {
  cropImage,
  getCropDimensions,
  type CropArea,
  type CropDimensions,
} from "./crop";
export {
  rotateImage,
  rotate90,
  getRotatedDimensions,
} from "./rotate";
export {
  applyLightingAdjustments,
  autoEvenLighting,
  type LightingAdjustments,
} from "./lighting";
export { getImageMetadata, type ImageMetadata } from "./metadata";
export {
  canvasToBlob,
  canvasToFile,
  getMimeTypeFromSource,
} from "./export";
// ImageOperation is already defined and exported above
