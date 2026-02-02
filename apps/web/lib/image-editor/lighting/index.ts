import { applyBrightnessContrast } from "./brightness-contrast";
import { applyShadowsHighlights } from "./shadows-highlights";
import { autoEvenLighting } from "./auto-even-lighting";
import {
  removeYellowing,
  evenColors,
  removeColorCast,
  autoColorCorrection,
} from "./color-correction";

/**
 * Lighting and color adjustment parameters
 */
export interface LightingAdjustments {
  brightness?: number; // -100 to +100
  contrast?: number; // -100 to +100
  shadows?: number; // 0 to 100
  highlights?: number; // 0 to 100
  removeYellowing?: number; // 0 to 100
  evenColors?: number; // 0 to 100
  autoColorCorrection?: boolean;
}

/**
 * Apply all lighting and color adjustments to a canvas
 * Operations are applied in order: brightness/contrast, shadows/highlights, then color corrections
 */
export function applyLightingAdjustments(
  canvas: HTMLCanvasElement,
  adjustments: LightingAdjustments,
): HTMLCanvasElement {
  let processed = canvas;

  // Apply brightness and contrast first
  if (
    adjustments.brightness !== undefined ||
    adjustments.contrast !== undefined
  ) {
    processed = applyBrightnessContrast(
      processed,
      adjustments.brightness ?? 0,
      adjustments.contrast ?? 0,
    );
  }

  // Apply shadow and highlight recovery
  if (
    adjustments.shadows !== undefined ||
    adjustments.highlights !== undefined
  ) {
    processed = applyShadowsHighlights(
      processed,
      adjustments.shadows ?? 0,
      adjustments.highlights ?? 0,
    );
  }

  // Apply auto color correction if requested
  if (adjustments.autoColorCorrection) {
    processed = autoColorCorrection(processed);
  }

  // Apply color corrections
  if (
    adjustments.removeYellowing !== undefined &&
    adjustments.removeYellowing > 0
  ) {
    processed = removeYellowing(processed, adjustments.removeYellowing);
  }

  if (adjustments.evenColors !== undefined && adjustments.evenColors > 0) {
    processed = evenColors(processed, adjustments.evenColors);
  }

  return processed;
}

export { applyBrightnessContrast } from "./brightness-contrast";
export { applyShadowsHighlights } from "./shadows-highlights";
export { autoEvenLighting } from "./auto-even-lighting";
export {
  removeYellowing,
  evenColors,
  removeColorCast,
  autoColorCorrection,
} from "./color-correction";
