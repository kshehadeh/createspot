/**
 * Validate image URLs with HTTP HEAD requests (no body download).
 * Used by museum script check-images and search --save.
 */

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_CONCURRENCY = 10;
/** Delay between chunks to reduce WAF/rate-limit risk. */
const DEFAULT_DELAY_BETWEEN_CHUNKS_MS = 200;

export interface ValidateImageUrlResult {
  ok: boolean;
  status?: number;
  error?: string;
}

export interface InvalidUrlInfo {
  status?: number;
  error?: string;
}

/** IIIF size segment: /full/123/ or /full/123,/ (comma is valid in IIIF). */
const IIIF_FULL_SIZE_PATTERN = /\/full\/\d+,?\//g;

/**
 * Replace IIIF /full/<n>/ (or /full/<n>,/) with /full/full/ so the server
 * chooses size. Use before saving or when fixing 403 responses.
 */
export function fix403ImageUrl(url: string): string {
  return url.replace(IIIF_FULL_SIZE_PATTERN, "/full/full/");
}

/**
 * Check a single image URL with HEAD. Returns { ok: true } if status 200,
 * otherwise { ok: false, status } or { ok: false, error } for network/timeout.
 */
export async function validateImageUrl(
  url: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<ValidateImageUrlResult> {
  const trimmed = url?.trim();
  if (!trimmed) {
    return { ok: false, error: "empty URL" };
  }
  try {
    new URL(trimmed);
  } catch {
    return { ok: false, error: "invalid URL" };
  }

  try {
    const res = await fetch(trimmed, {
      method: "HEAD",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok) {
      return { ok: true };
    }
    return { ok: false, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export interface ValidateImageUrlsOptions {
  concurrency?: number;
  timeoutMs?: number;
  /**
   * Delay in ms after each chunk before starting the next. Helps avoid WAF/rate
   * limiting. Default 200. Set to 0 for no delay.
   */
  delayBetweenChunksMs?: number;
  /** Called after each chunk with (checkedCount, totalCount). Use for progress. */
  onProgress?: (checked: number, total: number) => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check multiple URLs with a concurrency limit. Returns a Map of invalid URLs
 * only (url → { status } or { error }). Valid URLs are omitted.
 */
export async function validateImageUrls(
  urls: string[],
  options?: ValidateImageUrlsOptions,
): Promise<Map<string, InvalidUrlInfo>> {
  const concurrency = Math.max(1, options?.concurrency ?? DEFAULT_CONCURRENCY);
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const delayMs = Math.max(
    0,
    options?.delayBetweenChunksMs ?? DEFAULT_DELAY_BETWEEN_CHUNKS_MS,
  );
  const onProgress = options?.onProgress;
  const unique = [...new Set(urls.map((u) => u?.trim()).filter(Boolean))];
  const invalid = new Map<string, InvalidUrlInfo>();

  for (let i = 0; i < unique.length; i += concurrency) {
    const chunk = unique.slice(i, i + concurrency);
    const results = await Promise.all(
      chunk.map(async (url) => {
        const result = await validateImageUrl(url, timeoutMs);
        return { url, result };
      }),
    );
    for (const { url, result } of results) {
      if (!result.ok) {
        invalid.set(url, {
          ...(result.status != null && { status: result.status }),
          ...(result.error && { error: result.error }),
        });
      }
    }
    const checked = Math.min(i + chunk.length, unique.length);
    onProgress?.(checked, unique.length);
    if (delayMs > 0 && i + concurrency < unique.length) {
      await sleep(delayMs);
    }
  }

  return invalid;
}
