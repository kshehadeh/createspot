/**
 * Pure utility functions for exhibits that don't require database access.
 * These can be used in both server and client components.
 */

export function isExhibitActive(exhibit: {
  startTime: Date;
  endTime: Date;
  isActive: boolean;
}): boolean {
  if (!exhibit.isActive) {
    return false;
  }
  const now = new Date();
  return now >= exhibit.startTime && now <= exhibit.endTime;
}
