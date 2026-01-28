"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SubmissionLightbox } from "@/components/submission-lightbox";
import { Card } from "@/components/ui/card";

export interface ConstellationItem {
  id: string;
  imageUrl: string | null;
  text: string | null;
  title: string | null;
  promptWord: string | null;
}

interface PathPoint {
  x: number;
  y: number;
  index: number;
}

interface ConstellationPathProps {
  items: ConstellationItem[];
  className?: string;
  headerRef?: React.RefObject<HTMLElement | null>;
}

const ITEM_VERTICAL_GAP = 350;
const ITEM_HEIGHT_ESTIMATE = 280;
const MOBILE_ITEM_HEIGHT_ESTIMATE = 440;
const MOBILE_ITEM_VERTICAL_GAP = 460; // Slightly tighter spacing between mobile cards
const DIVIDER_PADDING = 32; // Padding below the dividing line

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

function calculatePathPoints(
  itemCount: number,
  containerWidth: number,
  topOffset: number = 0,
): PathPoint[] {
  const points: PathPoint[] = [];
  const isMobile = containerWidth < 640;
  const amplitude = isMobile ? 0 : containerWidth * 0.2;
  const centerX = containerWidth / 2;
  const verticalGap = isMobile ? MOBILE_ITEM_VERTICAL_GAP : ITEM_VERTICAL_GAP;
  const itemHeightEstimate = isMobile
    ? MOBILE_ITEM_HEIGHT_ESTIMATE
    : ITEM_HEIGHT_ESTIMATE;

  for (let i = 0; i < itemCount; i++) {
    const t = itemCount > 1 ? i / (itemCount - 1) : 0.5;
    // Use multiple sine waves for organic feel
    const x = isMobile
      ? centerX
      : centerX +
        amplitude * Math.sin(t * Math.PI * 2.5) * 0.6 +
        amplitude * Math.sin(t * Math.PI * 1.3 + 0.5) * 0.4;

    const y = topOffset + i * verticalGap + itemHeightEstimate / 2;

    points.push({ x, y, index: i });
  }

  return points;
}

function generateCurvePath(
  from: { x: number; y: number },
  to: { x: number; y: number },
): string {
  const midY = (from.y + to.y) / 2;
  // Control points create smooth S-curve
  const cp1 = { x: from.x, y: midY };
  const cp2 = { x: to.x, y: midY };

  return `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`;
}

interface PathItemProps {
  item: ConstellationItem;
  point: PathPoint;
  containerWidth: number;
  isVisible: boolean;
  onClick: () => void;
}

function PathItem({
  item,
  point,
  containerWidth,
  isVisible,
  onClick,
}: PathItemProps) {
  const hasImage = !!item.imageUrl;
  const hasText = !!item.text;
  const displayText = item.text ? stripHtml(item.text) : "";
  const isMobile = containerWidth < 640;
  const isEven = point.index % 2 === 0;

  // Image only
  if (hasImage && !hasText) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`group absolute cursor-pointer transition-all duration-700 ease-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
        style={{
          left: isMobile ? "50%" : point.x,
          top: "50%",
          transform: "translateX(-50%) translateY(-50%)",
          width: isMobile ? "calc(100% - 2rem)" : "min(400px, 50%)",
          maxWidth: "400px",
        }}
      >
        <Card className="relative aspect-[4/3] overflow-hidden rounded-2xl border-border bg-card shadow-sm transition-all duration-300 group-hover:shadow-lg group-hover:scale-[1.02]">
          <Image
            src={item.imageUrl!}
            alt={item.title || "Creative work"}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) calc(100vw - 2rem), 400px"
          />
          {item.title && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <p className="px-4 text-center text-base font-semibold text-white">
                {item.title}
              </p>
            </div>
          )}
        </Card>
      </button>
    );
  }

  // Text only
  if (hasText && !hasImage) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`group absolute cursor-pointer text-left transition-all duration-700 ease-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
        style={{
          left: isMobile ? "50%" : point.x,
          top: "50%",
          transform: "translateX(-50%) translateY(-50%)",
          width: isMobile ? "calc(100% - 2rem)" : "min(500px, 60%)",
          maxWidth: "500px",
        }}
      >
        <Card
          className="relative rounded-2xl border px-8 py-6 shadow-sm transition-all duration-300 group-hover:shadow-lg"
          style={{
            backgroundColor: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--card-foreground))",
          }}
        >
          <p
            className={`text-xl font-serif leading-relaxed line-clamp-4 transition-all duration-300 ${
              isMobile
                ? "text-fade-vertical group-hover:text-fade-none"
                : "text-fade group-hover:text-fade-none"
            }`}
          >
            {displayText.slice(0, 200)}
            {displayText.length > 200 ? "..." : ""}
          </p>
          {item.title && (
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              {item.title}
            </p>
          )}
        </Card>
      </button>
    );
  }

  // Image + Text
  if (hasImage && hasText) {
    const imageOnLeft = isEven;

    return (
      <button
        type="button"
        onClick={onClick}
        className={`group absolute cursor-pointer text-left transition-all duration-700 ease-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
        style={{
          left: isMobile ? "50%" : point.x,
          top: "50%",
          transform: "translateX(-50%) translateY(-50%)",
          width: isMobile ? "calc(100% - 2rem)" : "min(700px, 80%)",
          maxWidth: "700px",
        }}
      >
        <Card
          className={`flex gap-6 rounded-2xl border p-4 shadow-sm transition-all duration-300 group-hover:shadow-lg ${
            isMobile
              ? "flex-col"
              : imageOnLeft
                ? "flex-row"
                : "flex-row-reverse"
          }`}
        >
          <div
            className={`relative overflow-hidden rounded-xl ${
              isMobile
                ? "aspect-[4/3] w-full"
                : "aspect-[4/3] w-1/2 flex-shrink-0"
            }`}
          >
            <Image
              src={item.imageUrl!}
              alt={item.title || "Creative work"}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) calc(100vw - 2rem), 350px"
            />
          </div>
          <div className="flex flex-1 flex-col justify-center">
            {item.title && (
              <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
            )}
            <p
              className={`text-base leading-relaxed text-muted-foreground line-clamp-4 transition-all duration-300 ${
                isMobile
                  ? "text-fade-vertical group-hover:text-fade-none"
                  : "text-fade group-hover:text-fade-none"
              }`}
            >
              {displayText.slice(0, 150)}
              {displayText.length > 150 ? "..." : ""}
            </p>
          </div>
        </Card>
      </button>
    );
  }

  return null;
}

export function ConstellationPath({
  items,
  className,
  headerRef,
}: ConstellationPathProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const [selectedItem, setSelectedItem] = useState<ConstellationItem | null>(
    null,
  );
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

  // Ensure items are in the correct order (preserve array order)
  const orderedItems = useMemo(() => {
    return [...items];
  }, [items]);

  // Measure container width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      setContainerWidth(container.offsetWidth);
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Measure header height using observer
  useEffect(() => {
    const isMobile = containerWidth < 640;
    if (!isMobile) {
      setHeaderHeight(0);
      return;
    }

    // Use the passed headerRef if available
    const header = headerRef?.current;
    const container = containerRef.current;
    if (!header || !container) {
      setHeaderHeight(0);
      return;
    }

    const updateHeaderHeight = () => {
      // Get the header's bottom position and container's top position relative to viewport
      const headerRect = header.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Since header and container are siblings, calculate the gap between them
      // Positive gap means header is above container (normal)
      // Negative gap means header overlaps container
      const gap = containerRect.top - headerRect.bottom;

      // If header overlaps container, we need to offset items by the overlap amount
      // Otherwise, we just need a small padding to ensure items don't touch the header
      const padding = 20;

      if (gap < 0) {
        // Header overlaps container - offset by overlap amount plus padding
        setHeaderHeight(Math.abs(gap) + padding);
      } else if (gap < padding) {
        // Header is close to container - use padding to ensure spacing
        setHeaderHeight(padding);
      } else {
        // Header is well above container - no offset needed
        setHeaderHeight(0);
      }
    };

    updateHeaderHeight();

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateHeaderHeight);
    });
    resizeObserver.observe(header);
    resizeObserver.observe(container);

    // Also listen to scroll in case header is sticky
    const handleScroll = () => {
      requestAnimationFrame(updateHeaderHeight);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Also listen to window resize to check if mobile/desktop
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setHeaderHeight(0);
      } else {
        requestAnimationFrame(updateHeaderHeight);
      }
    };
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [containerWidth, headerRef]);

  // Calculate path points
  const points = useMemo(() => {
    if (containerWidth === 0 || orderedItems.length === 0) return [];
    const isMobile = containerWidth < 640;
    const topOffset = (isMobile ? headerHeight : 0) + DIVIDER_PADDING;
    return calculatePathPoints(orderedItems.length, containerWidth, topOffset);
  }, [orderedItems.length, containerWidth, headerHeight]);

  // Intersection Observer for scroll-based reveal
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      // Show all items immediately if user prefers reduced motion
      setVisibleItems(new Set(orderedItems.map((_, i) => i)));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute("data-index"));
          if (entry.isIntersecting) {
            setVisibleItems((prev) => new Set([...prev, index]));
          }
        });
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.1,
      },
    );

    itemRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [orderedItems.length, points]);

  // Register item refs for intersection observer
  const setItemRef = useCallback(
    (index: number, element: HTMLElement | null) => {
      if (element) {
        itemRefs.current.set(index, element);
      } else {
        itemRefs.current.delete(index);
      }
    },
    [],
  );

  const isMobile = containerWidth < 640;
  const verticalGap = isMobile ? MOBILE_ITEM_VERTICAL_GAP : ITEM_VERTICAL_GAP;
  const topOffset = (isMobile ? headerHeight : 0) + DIVIDER_PADDING;
  const itemHeightEstimate = isMobile
    ? MOBILE_ITEM_HEIGHT_ESTIMATE
    : ITEM_HEIGHT_ESTIMATE;
  const totalHeight =
    topOffset + orderedItems.length * verticalGap + itemHeightEstimate;

  // Generate SVG path for the connecting line
  const svgPath = useMemo(() => {
    if (points.length < 2 || isMobile) return "";

    let path = "";
    for (let i = 0; i < points.length - 1; i++) {
      path += generateCurvePath(points[i], points[i + 1]) + " ";
    }
    return path;
  }, [points, isMobile]);

  const mobilePath = useMemo(() => {
    if (!isMobile || points.length < 2) return "";
    const amplitude = Math.min(16, containerWidth * 0.05);
    const mobilePoints = points.map((point, index) => ({
      ...point,
      x: point.x + Math.sin(index * 1.2) * amplitude,
    }));

    let path = "";
    for (let i = 0; i < mobilePoints.length - 1; i++) {
      path += generateCurvePath(mobilePoints[i], mobilePoints[i + 1]) + " ";
    }
    return path;
  }, [points, isMobile, containerWidth]);

  if (orderedItems.length === 0 || containerWidth === 0) {
    return (
      <div
        ref={containerRef}
        className={`relative w-full min-h-[200px] ${className ?? ""}`}
      />
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`relative w-full ${className ?? ""}`}
        style={{ height: totalHeight }}
      >
        {/* Dividing line between header and path */}
        <div className="absolute left-0 right-0 top-0 border-t border-border" />

        {/* SVG connecting lines (desktop only) */}
        {!isMobile && svgPath && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ overflow: "visible" }}
          >
            <defs>
              <linearGradient
                id="pathGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#a1a1aa" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <path
              d={svgPath}
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="2"
              strokeDasharray="8 4"
            />
          </svg>
        )}

        {/* Mobile wavy line */}
        {isMobile && orderedItems.length > 1 && mobilePath && (
          <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full">
            <path
              d={mobilePath}
              fill="none"
              stroke="#fbbf24"
              strokeOpacity="0.7"
              strokeWidth="2"
              strokeDasharray="10 6"
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* Path items */}
        {orderedItems.map((item, index) => (
          <div
            key={item.id}
            ref={(el) => setItemRef(index, el)}
            data-index={index}
            className="absolute inset-x-0 z-10"
            style={{
              top: topOffset + index * verticalGap,
              height: itemHeightEstimate,
            }}
          >
            <PathItem
              item={item}
              point={points[index] ?? { x: containerWidth / 2, y: 0, index }}
              containerWidth={containerWidth}
              isVisible={visibleItems.has(index)}
              onClick={() => setSelectedItem(item)}
            />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedItem &&
        (() => {
          const currentIndex = orderedItems.findIndex(
            (i) => i.id === selectedItem.id,
          );
          const hasPrevious = currentIndex > 0;
          const hasNext =
            currentIndex >= 0 && currentIndex < orderedItems.length - 1;
          return (
            <SubmissionLightbox
              submission={{
                id: selectedItem.id,
                title: selectedItem.title,
                imageUrl: selectedItem.imageUrl,
                text: selectedItem.text,
              }}
              word={selectedItem.promptWord || ""}
              isOpen={!!selectedItem}
              onClose={() => setSelectedItem(null)}
              onGoToPrevious={() => {
                if (hasPrevious)
                  setSelectedItem(orderedItems[currentIndex - 1]);
              }}
              onGoToNext={() => {
                if (hasNext) setSelectedItem(orderedItems[currentIndex + 1]);
              }}
              hasPrevious={hasPrevious}
              hasNext={hasNext}
            />
          );
        })()}
    </>
  );
}
