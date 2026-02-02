/**
 * Converts focal point coordinates to CSS object-position value.
 * @param focalPoint - Focal point with x and y percentages (0-100)
 * @returns CSS object-position string (e.g., "50% 30%") or "center" if not set
 */
export function getObjectPositionStyle(
  focalPoint: { x: number; y: number } | null | undefined,
): string {
  if (!focalPoint) return "center";
  return `${focalPoint.x}% ${focalPoint.y}%`;
}
