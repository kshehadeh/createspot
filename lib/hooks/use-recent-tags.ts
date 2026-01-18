import { useCallback, useEffect, useState } from "react";
import type { TagSearchType } from "./use-tag-search";

const MAX_RECENT_TAGS = 10;
const RECENT_TAGS_KEY_PREFIX = "recent-tags-";

function getStorageKey(
  type: TagSearchType,
  userId?: string,
  exhibitId?: string,
): string {
  if (type === "portfolio" && userId) {
    return `${RECENT_TAGS_KEY_PREFIX}portfolio-${userId}`;
  }
  if (type === "exhibition") {
    return exhibitId
      ? `${RECENT_TAGS_KEY_PREFIX}exhibition-${exhibitId}`
      : `${RECENT_TAGS_KEY_PREFIX}exhibition-global`;
  }
  return `${RECENT_TAGS_KEY_PREFIX}${type}`;
}

export function useRecentTags(
  type: TagSearchType,
  userId?: string,
  exhibitId?: string,
) {
  const [recentTags, setRecentTags] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storageKey = getStorageKey(type, userId, exhibitId);
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        setRecentTags(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error("Error reading recent tags from localStorage:", error);
    }
  }, [type, userId, exhibitId]);

  const addRecentTag = useCallback(
    (tag: string) => {
      if (typeof window === "undefined") return;

      const storageKey = getStorageKey(type, userId, exhibitId);
      setRecentTags((prev) => {
        // Remove the tag if it already exists, then add it to the front
        const filtered = prev.filter((t) => t !== tag);
        const updated = [tag, ...filtered].slice(0, MAX_RECENT_TAGS);

        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (error) {
          console.error("Error saving recent tags to localStorage:", error);
        }

        return updated;
      });
    },
    [type, userId, exhibitId],
  );

  const getRecentTags = useCallback(
    (limit?: number): string[] => {
      return limit ? recentTags.slice(0, limit) : recentTags;
    },
    [recentTags],
  );

  return { recentTags, addRecentTag, getRecentTags };
}
