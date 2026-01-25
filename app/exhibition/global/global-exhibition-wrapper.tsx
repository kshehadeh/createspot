"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ExpandableBio } from "@/components/expandable-bio";
import { TextThumbnail } from "@/components/text-thumbnail";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExhibitViewSelector } from "@/components/exhibit-view-selector";
import { GlobalMap } from "./global-map";
import { getCreatorUrl } from "@/lib/utils";

interface ExhibitData {
  id: string;
  title: string;
  description: string | null;
  curator: {
    id: string;
    name: string | null;
    image: string | null;
  };
  featuredArtist: {
    id: string;
    name: string | null;
    image: string | null;
    slug?: string | null;
  } | null;
  featuredSubmission: {
    id: string;
    title: string | null;
    imageUrl: string | null;
    text: string | null;
    userId: string;
  } | null;
  allowedViewTypes: string[];
}

interface GlobalExhibitionWrapperProps {
  exhibitTitle: string;
  exhibit: ExhibitData | null;
  exhibitId?: string;
}

export function GlobalExhibitionWrapper({
  exhibitTitle,
  exhibit,
  exhibitId,
}: GlobalExhibitionWrapperProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const [mapHeight, setMapHeight] = useState<string>(
    "calc(100vh - var(--navbar-height) - 120px)",
  );

  useEffect(() => {
    const updateMapHeight = () => {
      const header = headerRef.current;

      if (!header) {
        // Fallback to default if element not found
        setMapHeight("calc(100vh - var(--navbar-height) - 120px)");
        return;
      }

      // Get the bottom edge of the header relative to the viewport
      const headerRect = header.getBoundingClientRect();
      const headerBottom = headerRect.bottom;

      // Calculate available height from header bottom to viewport bottom
      const availableHeight = window.innerHeight - headerBottom;

      setMapHeight(`${availableHeight}px`);
    };

    // Initial calculation
    updateMapHeight();

    if (!headerRef.current) return;

    // Use MutationObserver to watch for DOM changes (e.g., expand/collapse)
    const mutationObserver = new MutationObserver(() => {
      // Use requestAnimationFrame to ensure layout has been recalculated
      requestAnimationFrame(updateMapHeight);
    });

    mutationObserver.observe(headerRef.current, {
      childList: true, // Watch for added/removed child elements
      subtree: true, // Watch all descendants
      attributes: true, // Watch for attribute changes (like class changes)
      characterData: true, // Watch for text content changes
    });

    // Use ResizeObserver as backup for size changes that don't involve DOM mutations
    const resizeObserver = new ResizeObserver(() => {
      updateMapHeight();
    });

    resizeObserver.observe(headerRef.current);

    // Also observe navbar in case it changes
    const navbar = document.querySelector("nav");
    if (navbar) {
      resizeObserver.observe(navbar);
    }

    // Fallback: also listen to window resize
    window.addEventListener("resize", updateMapHeight);

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateMapHeight);
    };
  }, []);

  const hasFeaturedImage =
    exhibit?.featuredSubmission?.imageUrl || exhibit?.featuredSubmission?.text;

  return (
    <>
      <div ref={headerRef} className="px-6 pt-6 pb-4 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-6 flex-1">
            {/* Featured Image - Left Side */}
            {hasFeaturedImage && exhibit?.featuredSubmission && (
              <div className="shrink-0">
                <Link
                  href={`/creators/${exhibit.featuredSubmission.userId}/s/${exhibit.featuredSubmission.id}`}
                  className="block relative w-full sm:w-48 md:w-56 aspect-square rounded-lg overflow-hidden border border-border bg-muted transition-transform hover:scale-[1.02]"
                >
                  {exhibit.featuredSubmission.imageUrl ? (
                    <Image
                      src={exhibit.featuredSubmission.imageUrl}
                      alt={exhibit.featuredSubmission.title || exhibitTitle}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 224px"
                    />
                  ) : exhibit.featuredSubmission.text ? (
                    <TextThumbnail
                      text={exhibit.featuredSubmission.text}
                      className="h-full w-full"
                    />
                  ) : null}
                </Link>
              </div>
            )}

            {/* Title and Description - Right Side */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-foreground">
                {exhibitTitle}
              </h1>
              {exhibit && (
                <div className="mt-4 space-y-3">
                  {exhibit.description && (
                    <ExpandableBio
                      html={exhibit.description}
                      className="text-muted-foreground"
                    />
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {exhibit.featuredArtist && (
                      <div className="flex items-center gap-2">
                        <span>Featured Artist</span>
                        <Avatar className="h-5 w-5">
                          <AvatarImage
                            src={exhibit.featuredArtist.image || undefined}
                          />
                          <AvatarFallback className="bg-muted text-xs">
                            {exhibit.featuredArtist.name
                              ? exhibit.featuredArtist.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)
                              : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <Link
                          href={getCreatorUrl(exhibit.featuredArtist)}
                          className="font-medium hover:underline"
                        >
                          {exhibit.featuredArtist.name || "Anonymous"}
                        </Link>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span>Curated by</span>
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={exhibit.curator.image || undefined} />
                        <AvatarFallback className="bg-muted text-xs">
                          {exhibit.curator.name
                            ? exhibit.curator.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{exhibit.curator.name || "Anonymous"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <ExhibitViewSelector
            currentView="global"
            exhibitId={exhibitId}
            allowedViewTypes={exhibit?.allowedViewTypes}
          />
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <GlobalMap exhibitId={exhibitId} mapHeight={mapHeight} />
      </div>
    </>
  );
}
