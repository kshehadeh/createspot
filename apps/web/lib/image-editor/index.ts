/**
 * Main image editor module - orchestrates all image processing operations
 */

import type { CropArea } from "./crop";
import type { LightingAdjustments } from "./lighting";

/**
 * Image operation types
 */
export type ImageOperation =
  | { type: "crop"; area: CropArea }
  | { type: "rotate"; angle: number }
  | { type: "rotate90"; clockwise: boolean }
  | { type: "lighting"; adjustments: LightingAdjustments }
  | { type: "autoEvenLighting" };

// Re-export all public functions and types
export { loadImageToCanvas } from "./canvas-utils";
export {
  cropImage,
  type CropArea,
  type CropDimensions,
} from "./crop";
export { rotateImage } from "./rotate";
export { type LightingAdjustments } from "./lighting";
export { getImageMetadata, type ImageMetadata } from "./metadata";
export {
  canvasToFile,
  getMimeTypeFromSource,
} from "./export";
// ImageOperation is already defined and exported above
