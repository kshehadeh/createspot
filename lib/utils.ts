import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes a URL by prepending https:// if no protocol is present
 * @param url - The URL string to normalize
 * @returns The normalized URL with protocol, or null if invalid
 */
export function normalizeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  // If it already has a protocol, return as-is
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Otherwise, prepend https://
  return `https://${trimmed}`;
}

/**
 * Validates if a string is a valid URL
 * @param url - The URL string to validate
 * @returns true if valid, false otherwise
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;

  const normalized = normalizeUrl(url);
  if (!normalized) return false;

  try {
    new URL(normalized);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely extracts the hostname from a URL
 * @param url - The URL string
 * @returns The hostname or the original URL if parsing fails
 */
export function getUrlHostname(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return url || "";

  try {
    const normalized = normalizeUrl(url);
    if (!normalized) return url;
    return new URL(normalized).hostname;
  } catch {
    return url;
  }
}
