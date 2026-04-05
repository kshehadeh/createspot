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
import { useTranslations } from "next-intl";
import useEmblaCarousel from "embla-carousel-react";
import { CarouselNavButton } from "@/components/ui/carousel-nav-button";
import { cn } from "@/lib/utils";
import {
  buildSubmissionSlides,
  type SubmissionMediaInput,
  type SubmissionSlide,
} from "@/lib/submission-slides";

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

function TextSlideFeed({
  html,
  title,
}: {
  html: string;
  title?: string | null;
}) {
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

function TextSlideLightbox({
  html,
  title,
}: {
  html: string;
  title?: string | null;
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col justify-center overflow-y-auto bg-black/40 p-4 sm:p-6">
      {title && (
        <h3 className="mb-3 text-lg font-semibold text-zinc-200 line-clamp-2">
          {title}
        </h3>
      )}
      <div
        className="prose prose-sm prose-invert max-w-none text-zinc-300 prose-headings:text-zinc-200"
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
  variant,
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
  variant: "feed" | "lightbox";
}) {
  const interactive = !!(imageTapHandlers && imageTapA11y);

  return (
    <div
      className={cn(
        "relative h-full w-full bg-muted",
        variant === "lightbox" && "bg-black",
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

function renderSlide(
  slide: SubmissionSlide,
  index: number,
  options: {
    variant: "feed" | "lightbox";
    priority: boolean;
    t: (key: string, values?: Record<string, number | string>) => string;
    imageTapHandlers?: ReturnType<typeof useImageTapToLightbox>;
    imageTapA11y?: {
      role: "button";
      tabIndex: number;
      "aria-label": string;
      onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
    };
    onOpenLightbox?: boolean;
  },
) {
  const TextSlide =
    options.variant === "lightbox" ? TextSlideLightbox : TextSlideFeed;

  if (slide.type === "image") {
    return (
      <ImageSlide
        imageUrl={slide.imageUrl}
        alt={slide.alt}
        focalPoint={slide.focalPoint}
        priority={options.priority && index === 0}
        imageTapHandlers={
          options.onOpenLightbox ? options.imageTapHandlers : undefined
        }
        imageTapA11y={options.imageTapA11y}
        variant={options.variant}
      />
    );
  }
  if (slide.type === "text") {
    return <TextSlide html={slide.html} title={slide.title} />;
  }
  if (slide.type === "reference") {
    return (
      <div
        className={cn(
          "relative h-full w-full bg-muted",
          options.variant === "lightbox" && "bg-black",
          options.onOpenLightbox && "cursor-pointer",
        )}
        {...(options.onOpenLightbox && options.imageTapA11y
          ? { ...options.imageTapHandlers, ...options.imageTapA11y }
          : {})}
      >
        <Image
          src={slide.imageUrl}
          alt={options.t("referenceAlt")}
          fill
          className="pointer-events-none object-contain"
          sizes="(max-width: 640px) 100vw, min(100vw, 1280px)"
        />
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
          {options.t("reference")}
        </span>
      </div>
    );
  }
  if (slide.type === "progression") {
    return (
      <div
        className={cn(
          "relative h-full w-full bg-muted",
          options.variant === "lightbox" && "bg-black",
          options.onOpenLightbox && slide.imageUrl && "cursor-pointer",
        )}
        {...(options.onOpenLightbox && slide.imageUrl && options.imageTapA11y
          ? { ...options.imageTapHandlers, ...options.imageTapA11y }
          : {})}
      >
        {slide.imageUrl ? (
          <Image
            src={slide.imageUrl}
            alt={slide.label}
            fill
            className="pointer-events-none object-contain"
            sizes="(max-width: 640px) 100vw, min(100vw, 1280px)"
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
    );
  }
  return null;
}

export interface SubmissionMediaCarouselProps {
  submission: SubmissionMediaInput;
  submissionId: string;
  variant: "feed" | "lightbox";
  /** Feed: aspect-square. Lightbox: fills stage. */
  className?: string;
  priority?: boolean;
  onOpenLightbox?: (submissionId: string) => void;
  showDots?: boolean;
  /** When true, prev/next arrows use showOnHover (feed). When false, always visible (lightbox desktop group-hover). */
  navShowOnHover?: boolean;
  navButtonClassName?: string;
  dotsClassName?: string;
}

export function SubmissionMediaCarousel({
  submission,
  submissionId,
  variant,
  className,
  priority = false,
  onOpenLightbox,
  showDots = true,
  navShowOnHover = variant === "feed",
  navButtonClassName,
  dotsClassName,
}: SubmissionMediaCarouselProps) {
  const t = useTranslations("feed");
  const slides = buildSubmissionSlides(submission, {
    submissionAlt: t("submissionAlt"),
    progressionStep: (step, total) => t("progressionStep", { step, total }),
  });

  const openLightbox = useCallback(() => {
    onOpenLightbox?.(submissionId);
  }, [onOpenLightbox, submissionId]);

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

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
  }, [emblaApi, slides.length]);

  if (slides.length === 0) return null;

  const slideOpts = {
    variant,
    priority,
    t,
    imageTapHandlers,
    imageTapA11y,
    onOpenLightbox: !!onOpenLightbox,
  };

  const carouselShell = (
    <div
      className={cn(
        variant === "feed" &&
          "group relative aspect-square w-full overflow-hidden bg-muted",
        variant === "lightbox" &&
          "group relative flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-black",
        className,
      )}
    >
      <div
        ref={emblaRef}
        className={cn(
          "min-h-0 flex-1 overflow-hidden",
          variant === "lightbox" && "h-full",
        )}
      >
        <div className="flex h-full">
          {slides.map((slide, index) => (
            <div
              key={index}
              className="relative h-full min-w-0 flex-[0_0_100%]"
            >
              {renderSlide(slide, index, slideOpts)}
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <div className="absolute left-2 top-1/2 z-10 -translate-y-1/2">
            <CarouselNavButton
              side="prev"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              aria-label={t("previousSlide")}
              showOnHover={navShowOnHover}
              overlayDark={variant === "lightbox"}
              className={navButtonClassName}
            />
          </div>
          <div className="absolute right-2 top-1/2 z-10 -translate-y-1/2">
            <CarouselNavButton
              side="next"
              onClick={scrollNext}
              disabled={!canScrollNext}
              aria-label={t("nextSlide")}
              showOnHover={navShowOnHover}
              overlayDark={variant === "lightbox"}
              className={navButtonClassName}
            />
          </div>
        </>
      )}
    </div>
  );

  const dotsEl =
    showDots && slides.length > 1 ? (
      <div
        className={cn(
          "flex justify-center gap-1.5 pt-2 pb-1",
          variant === "lightbox" &&
            "pointer-events-auto absolute bottom-3 left-0 right-0 z-10 pt-0 pb-0",
          dotsClassName,
        )}
      >
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={t("goToSlide", { n: index + 1 })}
            className={cn(
              "h-1.5 rounded-full transition-all",
              variant === "feed" &&
                (index === selectedIndex
                  ? "w-3 bg-foreground"
                  : "w-1.5 bg-muted-foreground/40"),
              variant === "lightbox" &&
                (index === selectedIndex
                  ? "w-3 bg-white"
                  : "w-1.5 bg-white/40"),
            )}
          />
        ))}
      </div>
    ) : null;

  if (variant === "lightbox") {
    return (
      <div className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col">
        {carouselShell}
        {dotsEl}
      </div>
    );
  }

  return (
    <>
      {carouselShell}
      {dotsEl}
    </>
  );
}
