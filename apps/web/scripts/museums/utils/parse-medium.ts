import { normalizeStringArray, toTitleCase } from "./normalize";

const keywordMap: Array<{ match: RegExp; values: string[] }> = [
  {
    match: /photograph|gelatin|daguerreotype|cyanotype|albumen|chromogenic/i,
    values: ["Photography"],
  },
  { match: /oil/i, values: ["Oil"] },
  { match: /watercolor/i, values: ["Watercolor"] },
  { match: /acrylic/i, values: ["Acrylic"] },
  { match: /bronze/i, values: ["Bronze", "Sculpture"] },
  { match: /sculpture/i, values: ["Sculpture"] },
  { match: /print/i, values: ["Print"] },
  { match: /ink/i, values: ["Ink"] },
  { match: /canvas/i, values: ["Canvas"] },
  { match: /paper/i, values: ["Paper"] },
  { match: /wood/i, values: ["Wood"] },
  { match: /ceramic|porcelain/i, values: ["Ceramic"] },
  { match: /glass/i, values: ["Glass"] },
  { match: /silver/i, values: ["Silver"] },
];

function splitMediums(value: string) {
  return value
    .replace(/\(.*?\)/g, " ")
    .split(/,|;|\//)
    .flatMap((part) => part.split(/\bon\b|\band\b/i))
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function parseMediums(value?: string | null) {
  if (!value) {
    return { mediumDisplay: undefined, mediums: [] as string[] };
  }

  const mediumDisplay = value.trim();
  const parts = splitMediums(mediumDisplay).map(toTitleCase);
  const extra = keywordMap
    .filter((entry) => entry.match.test(mediumDisplay))
    .flatMap((entry) => entry.values);

  return {
    mediumDisplay,
    mediums: normalizeStringArray([...parts, ...extra]),
  };
}
