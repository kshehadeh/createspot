"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "@/components/link";
import { Button } from "@createspot/ui-primitives/button";
import { getObjectPositionStyle } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { usePageTurnGesture } from "./use-page-turn-gesture";

type TurnDirection = "next" | "prev";

export interface SketchbookItem {
  id: string;
  title: string | null;
  imageUrl: string | null;
  imageFocalPoint?: { x: number; y: number } | null;
  text: string | null;
  authorName?: string | null;
  href?: string;
}

interface SketchbookViewProps {
  items: SketchbookItem[];
  className?: string;
  emptyStateLabel: string;
  previousLabel?: string;
  nextLabel?: string;
  openLabel?: string;
}

const MOBILE_BREAKPOINT = 768;
const TURN_DURATION_MS = 420;

export function SketchbookView({
  items,
  className,
  emptyStateLabel,
  previousLabel = "Previous page",
  nextLabel = "Next page",
  openLabel = "Open submission",
}: SketchbookViewProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [turnDirection, setTurnDirection] = useState<TurnDirection | null>(
    null,
  );
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport, { passive: true });
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const pagesPerTurn = isMobile ? 1 : 2;
  const totalSlots = useMemo(() => {
    if (isMobile) return items.length;
    return Math.ceil(items.length / 2) * 2;
  }, [isMobile, items.length]);
  const maxIndex = Math.max(0, totalSlots - pagesPerTurn);
  const canTurnPrevious = pageIndex > 0;
  const canTurnNext = pageIndex < maxIndex;

  useEffect(() => {
    setPageIndex((current) => Math.min(current, maxIndex));
  }, [maxIndex]);

  const commitTurn = useCallback(
    (direction: TurnDirection) => {
      if (isAnimating) return;
      if (direction === "next" && !canTurnNext) return;
      if (direction === "prev" && !canTurnPrevious) return;

      setTurnDirection(direction);
      setIsAnimating(true);
      window.setTimeout(() => {
        setPageIndex((current) =>
          direction === "next"
            ? current + pagesPerTurn
            : current - pagesPerTurn,
        );
        setIsAnimating(false);
        setTurnDirection(null);
      }, TURN_DURATION_MS);
    },
    [canTurnNext, canTurnPrevious, isAnimating, pagesPerTurn],
  );

  const {
    dragOffsetX,
    isDragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  } = usePageTurnGesture({
    canTurnNext,
    canTurnPrevious,
    disabled: isAnimating,
    onCommit: commitTurn,
    thresholdPx: isMobile ? 50 : 80,
  });

  const turningProgress = Math.min(Math.abs(dragOffsetX) / 140, 1);
  const activeTurnDirection: TurnDirection | null =
    turnDirection ??
    (isDragging
      ? dragOffsetX < 0
        ? "next"
        : dragOffsetX > 0
          ? "prev"
          : null
      : null);
  const displayProgress = isAnimating ? 1 : turningProgress;

  const leftPage = items[pageIndex] ?? null;
  const rightPage = isMobile ? null : (items[pageIndex + 1] ?? null);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
        {emptyStateLabel}
      </div>
    );
  }

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={previousLabel}
          onClick={() => commitTurn("prev")}
          disabled={!canTurnPrevious || isAnimating}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {isMobile
            ? `${Math.min(pageIndex + 1, items.length)} / ${items.length}`
            : `${Math.floor(pageIndex / 2) + 1} / ${Math.max(
                1,
                Math.ceil(items.length / 2),
              )}`}
        </p>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={nextLabel}
          onClick={() => commitTurn("next")}
          disabled={!canTurnNext || isAnimating}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border/60 bg-[radial-gradient(circle_at_center,hsl(var(--muted)/0.55),hsl(var(--background))_65%)] p-3 sm:p-5",
          !isMobile && "mx-auto max-w-6xl",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        style={{ touchAction: "pan-y" }}
      >
        {!isMobile && (
          <div
            className="pointer-events-none absolute top-3 bottom-3 left-1/2 w-px -translate-x-1/2 bg-border/60"
            aria-hidden
          />
        )}

        <div
          className={cn(
            "grid gap-4",
            isMobile ? "grid-cols-1" : "grid-cols-2",
            "min-h-[420px] md:min-h-[520px]",
          )}
        >
          <PaperPage
            item={leftPage}
            openLabel={openLabel}
            isMobile={isMobile}
          />
          {!isMobile && (
            <PaperPage
              item={rightPage}
              openLabel={openLabel}
              isMobile={isMobile}
            />
          )}
        </div>

        {activeTurnDirection && (
          <div
            className="pointer-events-none absolute inset-3 z-20"
            aria-hidden
            style={{ perspective: "1600px" }}
          >
            <TurningSheet
              item={
                activeTurnDirection === "next"
                  ? (rightPage ?? leftPage)
                  : (leftPage ?? rightPage)
              }
              direction={activeTurnDirection}
              isMobile={isMobile}
              progress={displayProgress}
              animate={isAnimating}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function PaperPage({
  item,
  openLabel,
  isMobile,
}: {
  item: SketchbookItem | null;
  openLabel: string;
  isMobile: boolean;
}) {
  if (!item) {
    return (
      <article className="relative flex h-full min-h-[380px] items-center justify-center rounded-md border border-border/50 bg-muted/30 shadow-[inset_0_0_24px_hsl(var(--foreground)/0.04)]">
        <span className="text-xs uppercase tracking-wide text-muted-foreground/70">
          Blank page
        </span>
      </article>
    );
  }

  return (
    <article className="relative flex h-full min-h-[380px] flex-col overflow-hidden rounded-sm border border-border/60 bg-[linear-gradient(135deg,hsl(var(--background))_0%,hsl(var(--muted)/0.25)_100%)] shadow-[0_12px_32px_hsl(var(--foreground)/0.12),inset_0_0_30px_hsl(var(--foreground)/0.03)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_95%,hsl(var(--foreground)/0.03)_100%)] [background-size:100%_2.2rem]" />
      <div className="relative z-10 flex h-full flex-col p-4 sm:p-5">
        <h3 className="line-clamp-1 text-base font-semibold text-foreground sm:text-lg">
          {item.title || "Untitled"}
        </h3>
        {item.authorName && (
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            {item.authorName}
          </p>
        )}

        {item.imageUrl ? (
          <div
            className={cn(
              "relative mt-4 overflow-hidden rounded-sm border border-border/60 bg-muted",
              isMobile ? "aspect-[4/5]" : "aspect-[4/5]",
            )}
          >
            <Image
              src={item.imageUrl}
              alt={item.title || "Submission"}
              fill
              className="object-cover"
              style={{
                objectPosition: getObjectPositionStyle(item.imageFocalPoint),
              }}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        ) : (
          <div className="mt-4 rounded-sm border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
            {item.text ? (
              <div
                className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: item.text }}
              />
            ) : (
              "This page is intentionally blank."
            )}
          </div>
        )}

        {item.text && item.imageUrl && (
          <div className="mt-3 line-clamp-4 text-sm text-muted-foreground">
            <div
              className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: item.text }}
            />
          </div>
        )}

        {item.href && (
          <div className="mt-auto pt-4">
            <Button asChild variant="outline" size="sm">
              <Link href={item.href}>{openLabel}</Link>
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

function TurningSheet({
  item,
  direction,
  isMobile,
  progress,
  animate,
}: {
  item: SketchbookItem | null;
  direction: TurnDirection;
  isMobile: boolean;
  progress: number;
  animate: boolean;
}) {
  if (!item) return null;

  const origin =
    direction === "next"
      ? isMobile
        ? "left center"
        : "center left"
      : "right center";
  const signedRotation =
    direction === "next" ? -180 * progress : 180 * progress;
  const pagePlacementClass = isMobile
    ? "left-0 right-0"
    : direction === "next"
      ? "left-1/2 right-0"
      : "left-0 right-1/2";

  return (
    <div
      className={cn("absolute top-0 bottom-0", pagePlacementClass)}
      style={{
        transformOrigin: origin,
        transform: `rotateY(${signedRotation}deg)`,
        transition: animate
          ? `transform ${TURN_DURATION_MS}ms ease-in-out`
          : "none",
      }}
    >
      <div className="h-full overflow-hidden rounded-sm border border-border/60 bg-[linear-gradient(135deg,hsl(var(--background))_0%,hsl(var(--muted)/0.22)_100%)] shadow-[0_24px_45px_hsl(var(--foreground)/0.22)]">
        <div className="relative h-full p-4 sm:p-5">
          <h4 className="line-clamp-1 text-sm font-semibold text-foreground sm:text-base">
            {item.title || "Untitled"}
          </h4>
          {item.imageUrl ? (
            <div className="relative mt-3 h-[78%] overflow-hidden rounded-sm border border-border/60 bg-muted">
              <Image
                src={item.imageUrl}
                alt={item.title || "Submission"}
                fill
                className="object-cover"
                style={{
                  objectPosition: getObjectPositionStyle(item.imageFocalPoint),
                }}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ) : (
            <div className="mt-3 rounded-sm border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
              Turning page
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
