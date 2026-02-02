import { useCallback, useEffect, useState } from "react";

const MAX_RECENT_URLS = 10;
const RECENT_URLS_KEY = "recent-create-spot-urls";

/**
 * Get the base URL for Create Spot (e.g., https://create.spot or http://localhost:3000)
 */
function getBaseUrl(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.protocol}//${window.location.host}`;
}

/**
 * Check if a URL belongs to Create Spot
 */
function isCreateSpotUrl(url: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const urlObj = new URL(url);
    const currentHost = window.location.host;
    // Check if URL is from the same origin (same protocol and host)
    return urlObj.origin === `${window.location.protocol}//${currentHost}`;
  } catch {
    // If URL parsing fails, check if it's a relative path
    return url.startsWith("/");
  }
}

/**
 * Normalize URL to full URL format
 */
function normalizeUrl(url: string): string {
  if (typeof window === "undefined") return url;

  try {
    // If it's already a full URL, return it
    new URL(url);
    return url;
  } catch {
    // If it's a relative path, make it absolute
    const baseUrl = getBaseUrl();
    return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
  }
}

export function useRecentUrls() {
  const [recentUrls, setRecentUrls] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(RECENT_URLS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        // Filter to only include valid Create Spot URLs
        const validUrls = parsed.filter((url) => {
          try {
            return isCreateSpotUrl(url);
          } catch {
            return false;
          }
        });
        setRecentUrls(Array.isArray(validUrls) ? validUrls : []);
      }
    } catch (error) {
      console.error("Error reading recent URLs from localStorage:", error);
    }
  }, []);

  const addRecentUrl = useCallback((url: string) => {
    if (typeof window === "undefined") return;
    if (!isCreateSpotUrl(url)) return;

    const normalizedUrl = normalizeUrl(url);

    setRecentUrls((prev) => {
      // Remove the URL if it already exists, then add it to the front
      const filtered = prev.filter((u) => u !== normalizedUrl);
      const updated = [normalizedUrl, ...filtered].slice(0, MAX_RECENT_URLS);

      try {
        localStorage.setItem(RECENT_URLS_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Error saving recent URLs to localStorage:", error);
      }

      return updated;
    });
  }, []);

  const getRecentUrls = useCallback(
    (limit?: number): string[] => {
      return limit ? recentUrls.slice(0, limit) : recentUrls;
    },
    [recentUrls],
  );

  return { recentUrls, addRecentUrl, getRecentUrls };
}
