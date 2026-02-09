export function normalizeStringArray(values: Array<string | null | undefined>) {
  const normalized = values
    .flatMap((value) => (value ? value.split("|") : []))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return Array.from(new Set(normalized));
}

export function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .map((word) => {
      const trimmed = word.trim();
      if (!trimmed) return "";
      return trimmed[0].toUpperCase() + trimmed.slice(1).toLowerCase();
    })
    .join(" ")
    .trim();
}
