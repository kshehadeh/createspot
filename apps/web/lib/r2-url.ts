export function normalizeR2PublicUrl(
  r2PublicUrl: string | undefined,
): string | null {
  if (!r2PublicUrl) return null;
  const trimmed = r2PublicUrl.trim();
  if (!trimmed) return null;
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

export function getR2KeyFromPublicUrl(
  publicUrl: string,
  r2PublicUrl: string | undefined,
): string | null {
  const base = normalizeR2PublicUrl(r2PublicUrl);
  if (!base) return null;
  if (!publicUrl.startsWith(`${base}/`)) return null;
  const key = publicUrl.slice(base.length + 1);
  return key ? key : null;
}

export function joinR2PublicUrl(
  r2PublicUrl: string | undefined,
  key: string,
): string | null {
  const base = normalizeR2PublicUrl(r2PublicUrl);
  if (!base) return null;
  const trimmedKey = key.startsWith("/") ? key.slice(1) : key;
  return `${base}/${trimmedKey}`;
}
