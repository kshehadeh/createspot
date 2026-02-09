/**
 * Display names for museum IDs in the UI (filter dropdowns, labels).
 * Keys must match museumId from adapters (cleveland, nga, artic).
 */
export const MUSEUM_DISPLAY_NAMES: Record<string, string> = {
  nga: "National Gallery of Art",
  cleveland: "Cleveland Museum of Art",
  artic: "Art Institute of Chicago",
};

export function getMuseumDisplayName(museumId: string): string {
  return MUSEUM_DISPLAY_NAMES[museumId] ?? museumId;
}
