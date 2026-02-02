import { useState, useCallback } from "react";
import type { MultiSelectOption } from "@/components/ui/multi-select";
import { useRecentTags } from "./use-recent-tags";

export type TagSearchType = "portfolio" | "exhibition";

interface UseTagSearchOptions {
  type: TagSearchType;
  userId?: string;
  exhibitId?: string;
  totalTagsCount?: number; // Total number of available tags
}

export function useTagSearch({
  type,
  userId,
  exhibitId,
  totalTagsCount,
}: UseTagSearchOptions) {
  const [loading, setLoading] = useState(false);
  const { getRecentTags } = useRecentTags(type, userId, exhibitId);

  const searchTags = useCallback(
    async (query: string): Promise<MultiSelectOption[]> => {
      // If query is empty, return recent tags + top 5 most used tags from database
      if (!query.trim()) {
        if (type === "portfolio" && !userId) {
          return [];
        }

        setLoading(true);
        try {
          let url: string;
          if (type === "portfolio") {
            url = `/api/portfolio/tags?q=&userId=${encodeURIComponent(userId!)}`;
          } else {
            // exhibition
            const params = new URLSearchParams({
              q: "",
            });
            if (exhibitId) {
              params.set("exhibitId", exhibitId);
            }
            url = `/api/exhibition/tags?${params.toString()}`;
          }

          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            const topUsedTags = (data.topUsedTags || []) as string[];
            const recent = getRecentTags(5);

            // Combine recent tags with top used tags, removing duplicates
            const recentSet = new Set(recent);
            const combined = [...recent];
            for (const tag of topUsedTags) {
              if (!recentSet.has(tag) && combined.length < 5) {
                combined.push(tag);
              }
            }

            return combined.map((tag: string) => ({
              value: tag,
              label: type === "exhibition" ? `#${tag}` : tag,
            }));
          }
          return [];
        } catch (error) {
          console.error("Tag search error:", error);
          return [];
        } finally {
          setLoading(false);
        }
      }

      if (type === "portfolio" && !userId) {
        return [];
      }

      setLoading(true);
      try {
        let url: string;
        if (type === "portfolio") {
          url = `/api/portfolio/tags?q=${encodeURIComponent(query)}&userId=${encodeURIComponent(userId!)}`;
        } else {
          // exhibition
          const params = new URLSearchParams({
            q: query,
          });
          if (exhibitId) {
            params.set("exhibitId", exhibitId);
          }
          url = `/api/exhibition/tags?${params.toString()}`;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          return (data.tags || []).map((tag: string) => ({
            value: tag,
            label: type === "exhibition" ? `#${tag}` : tag,
          }));
        }
        return [];
      } catch (error) {
        console.error("Tag search error:", error);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [type, userId, exhibitId, totalTagsCount, getRecentTags],
  );

  return { searchTags, loading };
}
