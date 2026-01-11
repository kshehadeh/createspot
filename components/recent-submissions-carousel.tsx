"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getObjectPositionStyle } from "@/lib/image-utils";

interface Submission {
  id: string;
  title: string | null;
  imageUrl: string | null;
  imageFocalPoint?: { x: number; y: number } | null;
  text: string | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface RecentSubmissionsCarouselProps {
  submissions: Submission[];
}

export function RecentSubmissionsCarousel({
  submissions,
}: RecentSubmissionsCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  // Filter to only show submissions with images for the carousel
  const imageSubmissions = submissions.filter((s) => s.imageUrl);

  if (imageSubmissions.length === 0) {
    return null;
  }

  return (
    <div className="grid w-full flex-1 grid-rows-[auto_1fr_auto]">
      <div>
        <h3 className="text-xl font-semibold text-foreground">
          Recent Submissions
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          See what others are creating this week.
        </p>
      </div>
      <div className="group relative min-h-[280px]">
        <div
          className="absolute inset-0 overflow-hidden rounded-xl"
          ref={emblaRef}
        >
          <div className="flex h-full">
            {imageSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="relative h-full min-w-0 flex-[0_0_100%]"
              >
                <Link
                  href={`/s/${submission.id}`}
                  className="group block h-full overflow-hidden rounded-xl bg-muted"
                >
                  <Image
                    src={submission.imageUrl!}
                    alt={submission.title || "Creative work"}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    style={{
                      objectPosition: getObjectPositionStyle(
                        submission.imageFocalPoint,
                      ),
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex items-center gap-2">
                      {submission.user.image ? (
                        <Image
                          src={submission.user.image}
                          alt={submission.user.name || "User"}
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-medium text-white">
                          {submission.user.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                      <span className="truncate text-sm text-white">
                        {submission.user.name || "Anonymous"}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        <button
          type="button"
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-md backdrop-blur-sm transition-opacity hover:bg-background disabled:pointer-events-none disabled:opacity-0 opacity-0 group-hover:opacity-100"
          aria-label="Previous submission"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={scrollNext}
          disabled={!canScrollNext}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-md backdrop-blur-sm transition-opacity hover:bg-background disabled:pointer-events-none disabled:opacity-0 opacity-0 group-hover:opacity-100"
          aria-label="Next submission"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* View all link */}
      <div className="mt-3 text-right">
        <Link
          href="/exhibition/gallery"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Visit the gallery →
        </Link>
      </div>
    </div>
  );
}
