/** Lowercase particles that should not be title-cased in the middle of a name. */
const PARTICLES = new Set([
  "van",
  "von",
  "de",
  "der",
  "den",
  "la",
  "le",
  "el",
  "da",
  "di",
  "del",
  "della",
  "dos",
  "das",
  "du",
  "af",
  "of",
]);

/** Nationalities that are often appended to artist names in source data and should be stripped. */
const NATIONALITIES = new Set([
  "american",
  "argentine",
  "armenian",
  "australian",
  "austrian",
  "belgian",
  "brazilian",
  "british",
  "canadian",
  "chilean",
  "chinese",
  "colombian",
  "cuban",
  "danish",
  "dutch",
  "english",
  "finnish",
  "french",
  "german",
  "greek",
  "indian",
  "irish",
  "italian",
  "japanese",
  "mexican",
  "norwegian",
  "peruvian",
  "polish",
  "portuguese",
  "russian",
  "scottish",
  "spanish",
  "swedish",
  "swiss",
  "venezuelan",
  "welsh",
]);

/**
 * Strips common non-name metadata (years, nationality suffixes, activity prefixes) from artist strings.
 * Handles patterns like "Active France, 1881–1973 Pablo Picasso Spanish" -> "Pablo Picasso".
 */
function stripNonNameParts(s: string): string {
  let t = s.trim();

  // Strip leading "Active [Place], " or "Flourished [Place], " or "Worked in [Place], "
  t = t.replace(/^(?:Active|Flourished|Worked(?:\s+in)?)\s+[^,]+,?\s*/i, "");

  // Strip leading year range: "1881-1973 ", "1881 – 1973 ", "1881—1973 "
  t = t.replace(/^\d{4}\s*[-–—]\s*\d{4}\s+/i, "");

  // Strip leading single year: "1881 ", "c. 1881 "
  t = t.replace(/^(?:c\.?\s*)?\d{4}\s+/i, "");

  // Strip trailing nationality (as a whole word at end)
  const words = t.split(/\s+/);
  while (words.length > 1) {
    const last = words[words.length - 1].toLowerCase().replace(/[,.]$/, "");
    if (NATIONALITIES.has(last)) {
      words.pop();
      t = words.join(" ");
    } else {
      break;
    }
  }

  // Strip parenthetical content: "Pablo (artists) Picasso" or "Name (1881-1973)"
  t = t.replace(/\s*\([^)]*\)\s*/g, " ");

  return t.replace(/\s+/g, " ").trim();
}

/**
 * Normalize an artist name to a canonical "First Last" display form so that
 * "Gogh, Vincent van", "Vincent van Gogh", and "Van Gogh, Vincent" all
 * collapse to the same string for deduplication in facets and filters.
 *
 * - Strips non-name metadata: "Active [Place], " / "Flourished [Place], " prefixes,
 *   leading years (e.g. "1881-1973 "), trailing nationalities (e.g. " Spanish"),
 *   and parenthetical content.
 * - Trims and collapses internal whitespace.
 * - Converts "Last, First [Middle]" to "First [Middle] Last".
 * - Applies title-case but keeps particles (van, de, von, etc.) lowercase
 *   when they appear in the middle of the name.
 */
export function normalizeArtistName(raw: string): string {
  if (!raw || typeof raw !== "string") return "";

  let s = stripNonNameParts(raw)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/, ", ");

  if (!s) return "";

  const commaIndex = s.indexOf(",");
  if (commaIndex > 0) {
    const before = s.slice(0, commaIndex).trim();
    const after = s.slice(commaIndex + 1).trim();
    if (after && before) {
      s = `${after} ${before}`;
    }
  }

  const parts = s.split(/\s+/).filter(Boolean);
  const result = parts
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i > 0 && PARTICLES.has(lower)) {
        return lower;
      }
      return word[0].toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

  return result.trim();
}
