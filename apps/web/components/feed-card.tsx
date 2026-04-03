"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import Image from "next/image";
import Link from "@/components/link";
import { useTranslations } from "next-intl";
import useEmblaCarousel from "embla-carousel-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CarouselNavButton } from "@/components/ui/carousel-nav-button";
import { FavoriteButton } from "@/components/favorite-button";
import { ShareButton } from "@/components/share-button";
import { cn, getCreatorUrl } from "@/lib/utils";

const TAP_MAX_PX = 12;

function useImageTapToLightbox(onTap: () => void) {
  const startRef = useRef<{ x: number; y: number; id: number } | null>(null);

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    startRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  }, []);

  const onPointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const s = startRef.current;
      startRef.current = null;
      if (!s || e.pointerId !== s.id) return;
      if (Math.hypot(e.clientX - s.x, e.clientY - s.y) <= TAP_MAX_PX) {
        onTap();
      }
    },
    [onTap],
  );

  const onPointerCancel = useCallback((_e: PointerEvent<HTMLDivElement>) => {
    startRef.current = null;
  }, []);

  return { onPointerDown, onPointerUp, onPointerCancel };
}

interface Progression {
  id: string;
  imageUrl: string | null;
  text: string | null;
  comment: string | null;
  order: number;
}

export interface FeedCardSubmission {
  id: string;
  title: string | null;
  imageUrl: string | null;
  imageFocalPoint: { x: number; y: number } | null;
  text: string | null;
  referenceImageUrl: string | null;
  wordIndex: number | null;
  category: string | null;
  tags: string[];
  critiquesEnabled: boolean;
  createdAt: Date | string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    profileImageUrl: string | null;
    slug: string | null;
  };
  prompt: {
    word1: string;
    word2: string;
    word3: string;
  } | null;
  progressions: Progression[];
  _count: {
    favorites: number;
  };
}

interface FeedCardProps {
  submission: FeedCardSubmission;
  isLoggedIn: boolean;
  currentUserId?: string | null;
  priority?: boolean;
  /** When set, tapping an image slide opens the submission lightbox (short tap; drags the carousel). */
  onOpenLightbox?: (submissionId: string) => void;
}

type Slide =
  | {
      type: "image";
      imageUrl: string;
      alt: string;
      focalPoint?: { x: number; y: number } | null;
    }
  | { type: "text"; html: string; title?: string | null }
  | { type: "reference"; imageUrl: string }
  | {
      type: "progression";
      imageUrl?: string | null;
      html?: string | null;
      comment?: string | null;
      label: string;
    };

function buildSlides(
  submission: FeedCardSubmission,
  t: ReturnType<typeof useTranslations>,
): Slide[] {
  const slides: Slide[] = [];

  if (submission.imageUrl) {
    slides.push({
      type: "image",
      imageUrl: submission.imageUrl,
      alt: submission.title || t("submissionAlt"),
      focalPoint: submission.imageFocalPoint,
    });
  }

  if (submission.text) {
    slides.push({
      type: "text",
      html: submission.text,
      title: submission.title,
    });
  }

  if (submission.referenceImageUrl) {
    slides.push({ type: "reference", imageUrl: submission.referenceImageUrl });
  }

  submission.progressions.forEach((p, index) => {
    if (p.imageUrl || p.text) {
      slides.push({
        type: "progression",
        imageUrl: p.imageUrl,
        html: p.text,
        comment: p.comment,
        label: t("progressionStep", {
          step: index + 1,
          total: submission.progressions.length,
        }),
      });
    }
  });

  return slides;
}

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString();
}

function TextSlide({ html, title }: { html: string; title?: string | null }) {
  return (
    <div className="flex h-full w-full flex-col justify-center bg-muted/50 p-6">
      {title && (
        <h3 className="mb-3 text-lg font-semibold text-foreground line-clamp-2">
          {title}
        </h3>
      )}
      <div
        className="prose prose-sm dark:prose-invert max-h-[60vh] overflow-hidden text-foreground line-clamp-[12]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function ImageSlide({
  imageUrl,
  alt,
  priority,
  imageTapHandlers,
  imageTapA11y,
}: {
  imageUrl: string;
  alt: string;
  focalPoint?: { x: number; y: number } | null;
  priority?: boolean;
  imageTapHandlers?: {
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (e: PointerEvent<HTMLDivElement>) => void;
  };
  imageTapA11y?: {
    role: "button";
    tabIndex: number;
    "aria-label": string;
    onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
  };
}) {
  const interactive = !!(imageTapHandlers && imageTapA11y);

  return (
    <div
      className={cn(
        "relative h-full w-full bg-muted",
        interactive && "cursor-pointer",
      )}
      {...(interactive ? { ...imageTapHandlers, ...imageTapA11y } : {})}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={alt}
        className="pointer-events-none h-full w-full object-contain select-none"
        style={{ WebkitUserSelect: "none", userSelect: "none" }}
        draggable={false}
        loading={priority ? "eager" : "lazy"}
      />
    </div>
  );
}

export function FeedCard({
  submission,
  isLoggedIn,
  currentUserId: _currentUserId,
  priority = false,
  onOpenLightbox,
}: FeedCardProps) {
  const t = useTranslations("feed");
  const slides = buildSlides(submission, t);

  const openLightbox = useCallback(() => {
    onOpenLightbox?.(submission.id);
  }, [onOpenLightbox, submission.id]);

  const imageTapHandlers = useImageTapToLightbox(openLightbox);

  const imageTapA11y = onOpenLightbox
    ? {
        role: "button" as const,
        tabIndex: 0,
        "aria-label": t("openLightbox"),
        onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openLightbox();
          }
        },
      }
    : undefined;

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const creatorUrl = getCreatorUrl(submission.user);
  const submissionUrl = `${creatorUrl}/s/${submission.id}`;

  const userInitials = submission.user.name
    ? submission.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const promptWord =
    submission.prompt && submission.wordIndex
      ? [
          submission.prompt.word1,
          submission.prompt.word2,
          submission.prompt.word3,
        ][submission.wordIndex - 1]
      : null;

  return (
    <article className="border-b border-border last:border-b-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={creatorUrl} className="shrink-0">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={
                submission.user.profileImageUrl ||
                submission.user.image ||
                undefined
              }
              alt={submission.user.name || ""}
            />
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={creatorUrl}
            className="text-sm font-semibold text-foreground hover:underline truncate block"
          >
            {submission.user.name || t("anonymous")}
          </Link>
          {promptWord && (
            <span className="text-xs text-muted-foreground">{promptWord}</span>
          )}
        </div>
        <time
          dateTime={new Date(submission.createdAt).toISOString()}
          className="shrink-0 text-xs text-muted-foreground [font-variant-numeric:tabular-nums]"
        >
          {formatRelativeTime(submission.createdAt)}
        </time>
      </div>

      {/* Media carousel */}
      {slides.length > 0 && (
        <div className="group relative aspect-square w-full overflow-hidden bg-muted">
          <div ref={emblaRef} className="h-full overflow-hidden">
            <div className="flex h-full">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className="relative h-full min-w-0 flex-[0_0_100%]"
                >
                  {slide.type === "image" && (
                    <ImageSlide
                      imageUrl={slide.imageUrl}
                      alt={slide.alt}
                      focalPoint={slide.focalPoint}
                      priority={priority && index === 0}
                      imageTapHandlers={
                        onOpenLightbox ? imageTapHandlers : undefined
                      }
                      imageTapA11y={imageTapA11y}
                    />
                  )}
                  {slide.type === "text" && (
                    <TextSlide html={slide.html} title={slide.title} />
                  )}
                  {slide.type === "reference" && (
                    <div
                      className={cn(
                        "relative h-full w-full bg-muted",
                        onOpenLightbox && "cursor-pointer",
                      )}
                      {...(onOpenLightbox && imageTapA11y
                        ? { ...imageTapHandlers, ...imageTapA11y }
                        : {})}
                    >
                      <Image
                        src={slide.imageUrl}
                        alt={t("referenceAlt")}
                        fill
                        className="pointer-events-none object-contain"
                        sizes="(max-width: 640px) 100vw, 600px"
                      />
                      <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                        {t("reference")}
                      </span>
                    </div>
                  )}
                  {slide.type === "progression" && (
                    <div
                      className={cn(
                        "relative h-full w-full bg-muted",
                        onOpenLightbox && slide.imageUrl && "cursor-pointer",
                      )}
                      {...(onOpenLightbox && slide.imageUrl && imageTapA11y
                        ? { ...imageTapHandlers, ...imageTapA11y }
                        : {})}
                    >
                      {slide.imageUrl ? (
                        <Image
                          src={slide.imageUrl}
                          alt={slide.label}
                          fill
                          className="pointer-events-none object-contain"
                          sizes="(max-width: 640px) 100vw, 600px"
                        />
                      ) : slide.html ? (
                        <TextSlide html={slide.html} />
                      ) : null}
                      <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                        {slide.label}
                      </span>
                      {slide.comment && (
                        <span className="pointer-events-none absolute bottom-2 right-2 max-w-[60%] truncate rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                          {slide.comment}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Nav arrows — only shown when multiple slides */}
          {slides.length > 1 && (
            <>
              <div className="absolute left-2 top-1/2 z-10 -translate-y-1/2">
                <CarouselNavButton
                  side="prev"
                  onClick={scrollPrev}
                  disabled={!canScrollPrev}
                  aria-label={t("previousSlide")}
                  showOnHover
                />
              </div>
              <div className="absolute right-2 top-1/2 z-10 -translate-y-1/2">
                <CarouselNavButton
                  side="next"
                  onClick={scrollNext}
                  disabled={!canScrollNext}
                  aria-label={t("nextSlide")}
                  showOnHover
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 pt-2 pb-1">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={t("goToSlide", { n: index + 1 })}
              className={`h-1.5 rounded-full transition-all ${
                index === selectedIndex
                  ? "w-3 bg-foreground"
                  : "w-1.5 bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* Interaction bar */}
      <div className="flex items-center gap-2.5 px-4 py-2">
        {isLoggedIn && (
          <FavoriteButton
            submissionId={submission.id}
            size="sm"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-foreground transition-colors hover:bg-muted hover:text-foreground"
          />
        )}
        <ShareButton
          type="submission"
          submissionId={submission.id}
          userId={submission.user.id}
          userSlug={submission.user.slug}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent p-0 text-foreground transition-colors hover:bg-muted hover:text-foreground"
        />
        {submission.critiquesEnabled && (
          <Link
            href={`${submissionUrl}/critiques`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t("critiques")}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </Link>
        )}
        <Link
          href={submissionUrl}
          className="ml-auto rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {t("viewSubmission")}
        </Link>
      </div>

      {/* Favorite count + caption */}
      <div className="px-4 pb-4">
        {submission._count.favorites > 0 && (
          <p className="mb-1 text-sm font-semibold text-foreground">
            {t("favorites", { count: submission._count.favorites })}
          </p>
        )}
        {submission.title && (
          <p className="text-sm text-foreground">
            <Link
              href={creatorUrl}
              className="font-semibold mr-1 hover:underline"
            >
              {submission.user.name || t("anonymous")}
            </Link>
            {submission.title}
          </p>
        )}
        {submission.tags.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {submission.tags.map((tag) => `#${tag}`).join(" ")}
          </p>
        )}
      </div>
    </article>
  );
}
