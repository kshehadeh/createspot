"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ConstellationPath } from "@/components/constellation-path";
import { ExpandableBio } from "@/components/expandable-bio";
import { TextThumbnail } from "@/components/text-thumbnail";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCreatorUrl } from "@/lib/utils";
import { ExhibitViewSelector } from "@/components/exhibit-view-selector";
import type { ConstellationItem } from "@/components/constellation-path";

interface ConstellationExhibitHeaderProps {
  exhibitTitle: string;
  exhibit: {
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
      user: {
        id: string;
        slug: string | null;
      };
    } | null;
    allowedViewTypes: string[];
  } | null;
  exhibitId?: string;
  items: ConstellationItem[];
  className?: string;
}

export function ConstellationExhibitHeader({
  exhibitTitle,
  exhibit,
  exhibitId,
  items,
  className,
}: ConstellationExhibitHeaderProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const hasFeaturedImage =
    exhibit?.featuredSubmission?.imageUrl || exhibit?.featuredSubmission?.text;

  return (
    <>
      <div ref={headerRef} className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-6 flex-1">
            {/* Featured Image - Left Side */}
            {hasFeaturedImage && exhibit?.featuredSubmission && (
              <div className="shrink-0">
                <Link
                  href={`${getCreatorUrl(exhibit.featuredSubmission.user)}/s/${exhibit.featuredSubmission.id}`}
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
            currentView="constellation"
            exhibitId={exhibitId}
            allowedViewTypes={exhibit?.allowedViewTypes}
          />
        </div>
      </div>

      {items.length > 0 ? (
        <ConstellationPath
          items={items}
          className={className}
          headerRef={headerRef}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No public work available yet.
          </p>
        </div>
      )}
    </>
  );
}
