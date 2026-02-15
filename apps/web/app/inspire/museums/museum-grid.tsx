"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { MUSEUM_PAGE_SIZE } from "@/lib/museums/constants";
import { getMuseumDisplayName } from "@/lib/museums/museum-display-names";
import type { MuseumArtworkListItem } from "@/lib/museums/types";
import { MuseumLightbox } from "./museum-lightbox";

export type MuseumArtworkItem = MuseumArtworkListItem;

interface MuseumGridProps {
  initialArtworks: MuseumArtworkItem[];
  initialHasMore: boolean;
}

function getPrimaryArtistName(artists: unknown): string {
  if (!Array.isArray(artists) || artists.length === 0) return "";
  const first = artists[0];
  return first && typeof first === "object" && "name" in first
    ? String((first as { name: string }).name)
    : "";
}

export function MuseumGrid({
  initialArtworks,
  initialHasMore,
}: MuseumGridProps) {
  const [items, setItems] = useState(initialArtworks);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nextSkip, setNextSkip] = useState(initialArtworks.length);
  const [selectedArtwork, setSelectedArtwork] =
    useState<MuseumArtworkItem | null>(null);
  const searchParams = useSearchParams();
  const queryString = useMemo(() => searchParams.toString(), [searchParams]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems(initialArtworks);
    setHasMore(initialHasMore);
    setNextSkip(initialArtworks.length);
    setLoadError(null);
  }, [initialArtworks, initialHasMore]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setLoadError(null);

    try {
      const params = new URLSearchParams(queryString);
      params.set("skip", nextSkip.toString());
      params.set("take", String(MUSEUM_PAGE_SIZE));

      const response = await fetch(`/api/museums?${params.toString()}`);

      if (!response.ok) {
        throw new Error("loadMoreError");
      }

      const data = await response.json();

      setItems((prev) => [...prev, ...(data.artworks || [])]);
      setHasMore(Boolean(data.hasMore));
      setNextSkip((prev) => prev + (data.artworks?.length || 0));
    } catch (error) {
      setLoadError(
        error instanceof Error && error.message !== "loadMoreError"
          ? error.message
          : "loadMoreError",
      );
    } finally {
      setIsLoading(false);
    }
  }, [queryString, nextSkip, isLoading, hasMore]);

  useEffect(() => {
    if (!hasMore) return;

    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isLoading) {
          loadMore();
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, loadMore]);

  const t = useTranslations("museums.grid");

  if (items.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">{t("noMatches")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("tryDifferentFilters")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentIndex = selectedArtwork
    ? items.findIndex((a) => a.globalId === selectedArtwork.globalId)
    : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < items.length - 1;

  return (
    <>
      <motion.div
        layout
        className="grid w-full min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <AnimatePresence mode="popLayout">
          {items.map((artwork) => {
            const imageUrl = artwork.thumbnailUrl ?? artwork.imageUrl;
            const artistName = getPrimaryArtistName(artwork.artists);
            const museumName = getMuseumDisplayName(artwork.museumId);

            return (
              <motion.article
                key={artwork.globalId}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="group cursor-pointer overflow-hidden rounded-none border-0 transition-shadow duration-300 hover:shadow-[0_0_20px_4px_hsl(var(--ring)/0.3)]"
                onClick={() => setSelectedArtwork(artwork)}
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={artwork.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/80 via-black/60 to-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="px-4 text-center">
                      <h3 className="mb-2 text-lg font-semibold text-white drop-shadow-lg">
                        {artwork.title}
                      </h3>
                      {artistName && (
                        <p className="text-sm font-medium text-white/90 drop-shadow-md">
                          {artistName}
                        </p>
                      )}
                      <p className="text-xs font-medium text-white/80 drop-shadow-md">
                        {museumName}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </motion.div>

      <div ref={sentinelRef} className="h-10" />
      <div className="mt-4 flex flex-col items-center gap-2 text-sm text-muted-foreground">
        {isLoading && <span>{t("loadingMore")}</span>}
        {loadError && (
          <div className="flex items-center gap-3">
            <span className="text-red-500 dark:text-red-400">
              {loadError === "loadMoreError" ? t("loadMoreError") : loadError}
            </span>
            <button
              type="button"
              onClick={loadMore}
              className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground"
            >
              {t("retry")}
            </button>
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <span className="text-muted-foreground">{t("reachedEnd")}</span>
        )}
      </div>

      {selectedArtwork && (
        <MuseumLightbox
          artwork={selectedArtwork}
          isOpen={!!selectedArtwork}
          onClose={() => setSelectedArtwork(null)}
          navigation={{
            onGoToPrevious: () => {
              if (hasPrevious) setSelectedArtwork(items[currentIndex - 1]);
            },
            onGoToNext: () => {
              if (hasNext) setSelectedArtwork(items[currentIndex + 1]);
            },
            hasPrevious,
            hasNext,
            nextImageUrl: hasNext
              ? (items[currentIndex + 1]?.imageUrl ?? null)
              : null,
            prevImageUrl: hasPrevious
              ? (items[currentIndex - 1]?.imageUrl ?? null)
              : null,
          }}
        />
      )}
    </>
  );
}
