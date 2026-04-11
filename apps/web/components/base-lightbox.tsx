"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  ReactNode,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  VisuallyHidden,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CarouselNavButton } from "@/components/ui/carousel-nav-button";
import { useViewportHeight } from "@/lib/hooks/use-viewport-height";
import { useImagePreloader } from "@/lib/hooks/use-image-preloader";
import { usePinchZoom } from "@/lib/hooks/use-pinch-zoom";
import { cn } from "@/lib/utils";

export { LIGHTBOX_BUTTON_CLASS } from "@createspot/ui-primitives/button";

export interface BaseLightboxNavigation {
  onGoToPrevious: () => void;
  onGoToNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  /** Optional image URL for the next item; when provided, preloaded for instant display on navigate. */
  nextImageUrl?: string | null;
  /** Optional image URL for the previous item; when provided, preloaded for instant display on navigate. */
  prevImageUrl?: string | null;
  /** Label for previous button (for accessibility and tooltip) */
  prevLabel?: string;
  /** Label for next button (for accessibility and tooltip) */
  nextLabel?: string;
}

export interface BaseLightboxItem {
  id: string;
  imageUrl: string | null;
  text?: string | null;
  title?: string | null;
}

/** Which logical panel a render prop is drawing (for prev/next slide transitions). */
export type BaseLightboxSlideRole = "single" | "incoming" | "outgoing";

export interface BaseLightboxRenderContext {
  /** Whether device supports hover (desktop) */
  supportsHover: boolean;
  /** Current zoom state for mobile */
  touchZoom: {
    scale: number;
    translateX: number;
    translateY: number;
    isZoomed: boolean;
  };
  /** Viewport height */
  viewportHeight: number;
  /** Whether text overlay is open */
  isTextOverlayOpen: boolean;
  /** Set text overlay open state */
  setIsTextOverlayOpen: (open: boolean) => void;
  /**
   * During a prev/next transition, `outgoing` is the panel leaving and `incoming` is the new item.
   * `single` when only one panel is shown.
   */
  slideRole: BaseLightboxSlideRole;
}

export interface BaseLightboxProps {
  /** The current item to display */
  item: BaseLightboxItem;
  /** Whether the lightbox is open */
  isOpen: boolean;
  /** Callback when lightbox should close */
  onClose: () => void;
  /** Dialog title for accessibility */
  dialogTitle: string;
  /** Whether to enable download protection. Default: true */
  protectionEnabled?: boolean;
  /** Navigation configuration for prev/next */
  navigation?: BaseLightboxNavigation;
  /** Render function for control buttons (close, share, etc.) */
  renderControls?: (context: BaseLightboxRenderContext) => ReactNode;
  /** Render function for sidebar content (desktop xl+) */
  renderSidebar?: (context: BaseLightboxRenderContext) => ReactNode;
  /** Render function for metadata overlay (mobile) */
  renderMetadataOverlay?: (context: BaseLightboxRenderContext) => ReactNode;
  /** Lower-leading content on small screens only (e.g. title), aligned with bottom control stack */
  renderBottomLeading?: (context: BaseLightboxRenderContext) => ReactNode;
  /** Render function for text overlay modal content */
  renderTextOverlay?: (context: BaseLightboxRenderContext) => ReactNode;
  /** Callback when item changes (for tracking, etc.) */
  onItemChange?: (itemId: string) => void;
  /** Called when the prev/next slide animation finishes (outgoing panel removed). */
  onNavTransitionComplete?: () => void;
  /**
   * When true, show a very subtle checkerboard in the image column only (transparency cue).
   * Does not affect text-only panels. Default false.
   */
  subtleCheckerboardBehindImage?: boolean;
}

export function BaseLightbox({
  item,
  isOpen,
  onClose,
  dialogTitle,
  protectionEnabled = true,
  navigation,
  renderControls,
  renderSidebar,
  renderMetadataOverlay,
  renderBottomLeading,
  renderTextOverlay,
  onNavTransitionComplete,
  subtleCheckerboardBehindImage = false,
}: BaseLightboxProps) {
  const [zoomState, setZoomState] = useState<{
    isActive: boolean;
    x: number;
    y: number;
    imageRect: DOMRect | null;
  }>({ isActive: false, x: 0, y: 0, imageRect: null });
  const [supportsHover, setSupportsHover] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isTextOverlayOpen, setIsTextOverlayOpen] = useState(false);
  /** Previous item while a horizontal strip transition is playing (outgoing panel). */
  const [outgoingItem, setOutgoingItem] = useState<BaseLightboxItem | null>(
    null,
  );
  const [navDirection, setNavDirection] = useState<"next" | "prev" | null>(
    null,
  );
  /** After strip mounts at the initial offset, set true to run CSS transition. */
  const [shouldAnimateStrip, setShouldAnimateStrip] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const viewportHeight = useViewportHeight();

  // Swipe-to-navigate state (mobile only, when prev/next exist)
  const SWIPE_THRESHOLD_PX = 50;
  const swipeStartRef = useRef<{
    x: number;
    y: number;
    wasZoomed: boolean;
  } | null>(null);

  // Preload adjacent images
  const nextImageUrl = navigation?.nextImageUrl;
  const prevImageUrl = navigation?.prevImageUrl;
  useImagePreloader(isOpen ? [nextImageUrl, prevImageUrl] : []);

  // Pinch-to-zoom hook for mobile
  const {
    touchZoom,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    setBaseDimensions,
    resetTouchZoom,
  } = usePinchZoom({
    supportsHover,
    imageRef,
    imageContainerRef,
  });

  const hasPrevious = navigation?.hasPrevious ?? false;
  const hasNext = navigation?.hasNext ?? false;
  const onGoToPrevious = navigation?.onGoToPrevious;
  const onGoToNext = navigation?.onGoToNext;

  const inNavTransition = outgoingItem != null;

  // Wrapped nav handlers: stash outgoing item, then let parent update `item` to the target
  const handleGoToPrevious = useCallback(() => {
    if (!hasPrevious || !onGoToPrevious || inNavTransition) return;
    if (reduceMotion) {
      onGoToPrevious();
      return;
    }
    setOutgoingItem(item);
    setNavDirection("prev");
    setShouldAnimateStrip(false);
    onGoToPrevious();
  }, [hasPrevious, onGoToPrevious, inNavTransition, reduceMotion, item]);

  const handleGoToNext = useCallback(() => {
    if (!hasNext || !onGoToNext || inNavTransition) return;
    if (reduceMotion) {
      onGoToNext();
      return;
    }
    setOutgoingItem(item);
    setNavDirection("next");
    setShouldAnimateStrip(false);
    onGoToNext();
  }, [hasNext, onGoToNext, inNavTransition, reduceMotion, item]);

  const hasNavigation =
    onGoToPrevious != null && onGoToNext != null && (hasPrevious || hasNext);
  const canSwipeToNavigate =
    !supportsHover && hasNavigation && !touchZoom.isZoomed && !inNavTransition;

  const handleTouchStartWithSwipe = useCallback(
    (e: React.TouchEvent<HTMLImageElement>) => {
      if (canSwipeToNavigate && e.touches.length === 1) {
        swipeStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          wasZoomed: touchZoom.isZoomed,
        };
      }
      handleTouchStart(e);
    },
    [canSwipeToNavigate, touchZoom.isZoomed, handleTouchStart],
  );

  const handleTouchEndWithSwipe = useCallback(
    (e: React.TouchEvent<HTMLImageElement>) => {
      if (
        canSwipeToNavigate &&
        swipeStartRef.current &&
        e.touches.length === 0 &&
        e.changedTouches.length > 0
      ) {
        const start = swipeStartRef.current;
        const released = e.changedTouches[0];
        const deltaX = released.clientX - start.x;
        const deltaY = released.clientY - start.y;

        if (
          !start.wasZoomed &&
          Math.abs(deltaX) >= SWIPE_THRESHOLD_PX &&
          Math.abs(deltaX) > Math.abs(deltaY)
        ) {
          if (deltaX > 0 && hasPrevious) {
            handleGoToPrevious();
          } else if (deltaX < 0 && hasNext) {
            handleGoToNext();
          }
        }
        swipeStartRef.current = null;
      }
      handleTouchEnd(e);
    },
    [
      canSwipeToNavigate,
      hasPrevious,
      hasNext,
      handleGoToPrevious,
      handleGoToNext,
      handleTouchEnd,
    ],
  );

  // Simpler swipe handlers for text-only content (no pinch-zoom)
  const canSwipeTextOnly = !supportsHover && hasNavigation && !inNavTransition;

  const handleTextTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (canSwipeTextOnly && e.touches.length === 1) {
        swipeStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          wasZoomed: false,
        };
      }
    },
    [canSwipeTextOnly],
  );

  const handleTextTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (
        canSwipeTextOnly &&
        swipeStartRef.current &&
        e.touches.length === 0 &&
        e.changedTouches.length > 0
      ) {
        const start = swipeStartRef.current;
        const released = e.changedTouches[0];
        const deltaX = released.clientX - start.x;
        const deltaY = released.clientY - start.y;

        if (
          Math.abs(deltaX) >= SWIPE_THRESHOLD_PX &&
          Math.abs(deltaX) > Math.abs(deltaY)
        ) {
          if (deltaX > 0 && hasPrevious) {
            handleGoToPrevious();
          } else if (deltaX < 0 && hasNext) {
            handleGoToNext();
          }
        }
        swipeStartRef.current = null;
      }
    },
    [
      canSwipeTextOnly,
      hasPrevious,
      hasNext,
      handleGoToPrevious,
      handleGoToNext,
    ],
  );

  const hasText = !!item.text;

  // Check if device supports hover (not touch)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSupportsHover(window.matchMedia("(hover: hover)").matches);
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Handle Escape key to close text overlay
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isTextOverlayOpen) {
        setIsTextOverlayOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isTextOverlayOpen]);

  // Reset pinch-zoom when switching items
  useEffect(() => {
    if (isOpen) {
      resetTouchZoom();
    }
  }, [isOpen, item.id, resetTouchZoom]);

  useEffect(() => {
    setImageLoaded(false);
  }, [item.id]);

  useEffect(() => {
    if (!isOpen) {
      setOutgoingItem(null);
      setNavDirection(null);
      setShouldAnimateStrip(false);
    }
  }, [isOpen]);

  const STRIP_TRANSITION_MS = 280;

  // After the two-panel strip mounts, run the translate animation on the next frame.
  useLayoutEffect(() => {
    if (!outgoingItem || navDirection == null || reduceMotion) return;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setShouldAnimateStrip(true);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [outgoingItem, item.id, navDirection, reduceMotion]);

  const handleStripTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName !== "transform") return;
      if (e.target !== e.currentTarget) return;
      setOutgoingItem(null);
      setNavDirection(null);
      setShouldAnimateStrip(false);
      onNavTransitionComplete?.();
    },
    [onNavTransitionComplete],
  );

  // Handle ArrowLeft/ArrowRight for previous/next
  useEffect(() => {
    if (!isOpen || isTextOverlayOpen) return;

    const handleArrow = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && hasPrevious) {
        e.preventDefault();
        handleGoToPrevious();
      } else if (e.key === "ArrowRight" && hasNext) {
        e.preventDefault();
        handleGoToNext();
      }
    };
    window.addEventListener("keydown", handleArrow);
    return () => window.removeEventListener("keydown", handleArrow);
  }, [
    isOpen,
    isTextOverlayOpen,
    handleGoToPrevious,
    handleGoToNext,
    hasPrevious,
    hasNext,
  ]);

  const handleImageMouseMove = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      if (!supportsHover || !imageRef.current || !imageLoaded) return;

      const imageRect = imageRef.current.getBoundingClientRect();
      const x = e.clientX - imageRect.left;
      const y = e.clientY - imageRect.top;

      setZoomState({
        isActive: true,
        x,
        y,
        imageRect,
      });
    },
    [supportsHover, imageLoaded],
  );

  const handleImageMouseLeave = useCallback(() => {
    setZoomState((prev) => ({ ...prev, isActive: false }));
  }, []);

  // Prevent right-click context menu
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (protectionEnabled) {
        e.preventDefault();
        return false;
      }
    },
    [protectionEnabled],
  );

  // Prevent drag start
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (protectionEnabled) {
        e.preventDefault();
        return false;
      }
    },
    [protectionEnabled],
  );

  // Zoom preview calculations
  const ZOOM_SQUARE_SIZE = 200;
  const ZOOM_PREVIEW_SIZE = 400;
  const ZOOM_LEVEL = ZOOM_PREVIEW_SIZE / ZOOM_SQUARE_SIZE;

  const getZoomPreviewStyle = (
    sourceItem: BaseLightboxItem,
  ): React.CSSProperties => {
    if (
      !zoomState.isActive ||
      !zoomState.imageRect ||
      !imageRef.current ||
      typeof window === "undefined" ||
      !sourceItem.imageUrl
    ) {
      return { display: "none" };
    }

    const imageWidth = zoomState.imageRect.width;
    const imageHeight = zoomState.imageRect.height;

    if (imageWidth < ZOOM_SQUARE_SIZE || imageHeight < ZOOM_SQUARE_SIZE) {
      return { display: "none" };
    }

    const halfSize = ZOOM_SQUARE_SIZE / 2;
    const clampedX = Math.max(
      halfSize,
      Math.min(imageWidth - halfSize, zoomState.x),
    );
    const clampedY = Math.max(
      halfSize,
      Math.min(imageHeight - halfSize, zoomState.y),
    );

    const bgWidth = imageWidth * ZOOM_LEVEL;
    const bgHeight = imageHeight * ZOOM_LEVEL;
    const bgPosX = ZOOM_PREVIEW_SIZE / 2 - clampedX * ZOOM_LEVEL;
    const bgPosY = ZOOM_PREVIEW_SIZE / 2 - clampedY * ZOOM_LEVEL;

    const isSidebarVisible = window.innerWidth >= 1280 && sidebarRef.current;

    if (isSidebarVisible && sidebarRef.current) {
      const leftMargin = 16;
      const rightMargin = 16;
      const availableWidth = 400 - leftMargin - rightMargin;
      const zoomSize = Math.min(ZOOM_PREVIEW_SIZE, availableWidth);

      return {
        position: "absolute" as const,
        backgroundImage: `url(${sourceItem.imageUrl})`,
        backgroundSize: `${bgWidth}px ${bgHeight}px`,
        backgroundPosition: `${bgPosX}px ${bgPosY}px`,
        backgroundRepeat: "no-repeat",
        backgroundColor: "#000",
        left: `${leftMargin}px`,
        top: `${leftMargin}px`,
        width: `${zoomSize}px`,
        height: `${zoomSize}px`,
      };
    }

    const margin = 20;
    return {
      position: "fixed" as const,
      backgroundImage: `url(${sourceItem.imageUrl})`,
      backgroundSize: `${bgWidth}px ${bgHeight}px`,
      backgroundPosition: `${bgPosX}px ${bgPosY}px`,
      backgroundRepeat: "no-repeat",
      backgroundColor: "#000",
      left: `${margin}px`,
      top: `${margin}px`,
    };
  };

  const getZoomSquareStyle = () => {
    if (
      !zoomState.isActive ||
      !imageContainerRef.current ||
      !zoomState.imageRect
    )
      return {};

    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const imageRect = zoomState.imageRect;

    const imageLeft = imageRect.left - containerRect.left;
    const imageTop = imageRect.top - containerRect.top;

    const halfSize = ZOOM_SQUARE_SIZE / 2;
    const squareX = Math.max(
      imageLeft,
      Math.min(
        imageLeft + imageRect.width - ZOOM_SQUARE_SIZE,
        imageLeft + zoomState.x - halfSize,
      ),
    );
    const squareY = Math.max(
      imageTop,
      Math.min(
        imageTop + imageRect.height - ZOOM_SQUARE_SIZE,
        imageTop + zoomState.y - halfSize,
      ),
    );

    if (
      imageRect.width < ZOOM_SQUARE_SIZE ||
      imageRect.height < ZOOM_SQUARE_SIZE
    ) {
      return { display: "none" };
    }

    return {
      left: `${squareX}px`,
      top: `${squareY}px`,
    };
  };

  const makeContext = (
    slideRole: BaseLightboxSlideRole,
  ): BaseLightboxRenderContext => ({
    supportsHover,
    touchZoom,
    viewportHeight,
    isTextOverlayOpen,
    setIsTextOverlayOpen,
    slideRole,
  });

  const renderSlideColumn = (
    panelItem: BaseLightboxItem,
    slideRole: BaseLightboxSlideRole,
    columnVariant: "strip" | "full",
  ) => {
    const panelHasImage = !!panelItem.imageUrl;
    const panelHasText = !!panelItem.text;
    const interactive = slideRole !== "outgoing";
    const ctx = makeContext(slideRole);
    const colWidthClass =
      columnVariant === "strip"
        ? "min-w-0 flex-[0_0_50%]"
        : "h-full w-full min-w-0";

    return (
      <div
        key={`${slideRole}-${panelItem.id}`}
        className={`flex ${colWidthClass} flex-col overflow-y-auto p-0 md:overflow-hidden ${
          panelHasImage ? "flex-col xl:flex-row" : "flex-col"
        } ${slideRole === "outgoing" ? "pointer-events-none" : ""}`}
        onClick={(e) => {
          if (interactive) e.stopPropagation();
        }}
      >
        {panelHasImage && (
          <div
            ref={interactive ? imageContainerRef : undefined}
            className={cn(
              "protected-image-wrapper relative flex h-full flex-1 items-center justify-center overflow-hidden",
              subtleCheckerboardBehindImage && "lightbox-image-checkerboard",
            )}
            style={{
              touchAction: supportsHover ? "none" : "pan-x pan-y",
            }}
            onContextMenu={interactive ? handleContextMenu : undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={interactive ? imageRef : undefined}
              src={panelItem.imageUrl!}
              alt={panelItem.title || "Image"}
              className={`h-auto w-auto max-h-[100dvh] max-w-full object-contain select-none ${
                interactive ? "" : "pointer-events-none"
              }`}
              style={{
                maxHeight:
                  viewportHeight > 0 ? `${viewportHeight}px` : "100dvh",
                maxWidth: "100%",
                ...(interactive && !supportsHover && touchZoom.isZoomed
                  ? {
                      transform: `translate(${touchZoom.translateX}px, ${touchZoom.translateY}px) scale(${touchZoom.scale})`,
                      transformOrigin: "center center",
                      transition: "none",
                    }
                  : {}),
                ...(protectionEnabled
                  ? { WebkitUserSelect: "none", userSelect: "none" }
                  : {}),
              }}
              onLoad={
                interactive
                  ? () => {
                      setImageLoaded(true);
                      setBaseDimensions();
                    }
                  : undefined
              }
              onMouseMove={interactive ? handleImageMouseMove : undefined}
              onMouseLeave={interactive ? handleImageMouseLeave : undefined}
              onTouchStart={interactive ? handleTouchStartWithSwipe : undefined}
              onTouchMove={interactive ? handleTouchMove : undefined}
              onTouchEnd={interactive ? handleTouchEndWithSwipe : undefined}
              draggable={interactive && !protectionEnabled}
              onDragStart={interactive ? handleDragStart : undefined}
            />

            {interactive && zoomState.isActive && supportsHover && (
              <div
                className="pointer-events-none absolute z-20 border-2 border-white bg-white/10 xl:hidden"
                style={{
                  width: `${ZOOM_SQUARE_SIZE}px`,
                  height: `${ZOOM_SQUARE_SIZE}px`,
                  ...getZoomSquareStyle(),
                }}
              />
            )}

            {interactive && zoomState.isActive && supportsHover && (
              <div
                className="pointer-events-none z-50 border-2 border-white/90 shadow-2xl xl:hidden"
                style={{
                  width: `${ZOOM_PREVIEW_SIZE}px`,
                  height: `${ZOOM_PREVIEW_SIZE}px`,
                  ...getZoomPreviewStyle(panelItem),
                }}
              />
            )}

            {interactive && !supportsHover && touchZoom.isZoomed && (
              <div
                className="absolute left-4 top-4 z-20 rounded-lg bg-black/70 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
                style={{
                  top: `max(1rem, env(safe-area-inset-top, 0px) + 1rem)`,
                  left: `max(1rem, env(safe-area-inset-left, 0px) + 1rem)`,
                }}
              >
                {Math.round(touchZoom.scale * 100)}%
              </div>
            )}
          </div>
        )}

        {panelHasImage && renderSidebar && (
          <div
            ref={interactive ? sidebarRef : undefined}
            className="hidden xl:flex xl:w-[400px] xl:flex-shrink-0 xl:flex-col xl:overflow-hidden xl:border-l xl:border-border/50 xl:bg-black/40"
          >
            {interactive && zoomState.isActive && supportsHover && (
              <div className="relative flex-shrink-0 p-4">
                <div
                  className="border-2 border-white/90 shadow-2xl"
                  style={{
                    width: `${ZOOM_PREVIEW_SIZE}px`,
                    height: `${ZOOM_PREVIEW_SIZE}px`,
                    ...getZoomPreviewStyle(panelItem),
                  }}
                />
              </div>
            )}
            {renderSidebar(ctx)}
          </div>
        )}

        {panelHasText && !panelHasImage && (
          <div
            className="relative flex h-full w-full flex-1 items-center justify-center overflow-y-auto p-8 sm:p-12"
            style={{
              touchAction: supportsHover ? "auto" : "pan-y",
            }}
            onTouchStart={interactive ? handleTextTouchStart : undefined}
            onTouchEnd={interactive ? handleTextTouchEnd : undefined}
          >
            <div className="mx-auto w-full max-w-4xl">
              {panelItem.title && (
                <h2 className="mb-6 text-3xl font-semibold text-muted-foreground sm:text-4xl">
                  {panelItem.title}
                </h2>
              )}
              <div
                className="prose prose-lg prose-invert max-w-none text-muted-foreground prose-headings:text-muted-foreground prose-p:text-muted-foreground prose-strong:text-muted-foreground prose-em:text-muted-foreground prose-a:text-muted-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-li:text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: panelItem.text! }}
              />
            </div>
          </div>
        )}

        {renderMetadataOverlay && (
          <div
            className="absolute left-4 right-4 z-10 rounded-xl bg-black/70 px-4 py-3 backdrop-blur-sm sm:left-8 sm:right-8 sm:px-6 sm:py-4 xl:hidden"
            style={{
              top:
                interactive && !supportsHover && touchZoom.isZoomed
                  ? `max(4.5rem, calc(env(safe-area-inset-top, 0px) + 4.5rem))`
                  : `max(1rem, env(safe-area-inset-top, 0px) + 1rem)`,
            }}
          >
            {renderMetadataOverlay(ctx)}
          </div>
        )}
      </div>
    );
  };

  const controlStackBottom =
    typeof window !== "undefined" && window.innerWidth < 768
      ? `max(2rem, calc(env(safe-area-inset-bottom, 0px) + 2rem))`
      : `max(1rem, env(safe-area-inset-bottom, 0px) + 1rem)`;

  const chromeContext = makeContext(
    outgoingItem && navDirection && !reduceMotion ? "incoming" : "single",
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-screen max-w-none max-h-none border-none bg-black/90 p-0 [&>button:last-child]:hidden overflow-hidden md:overflow-hidden"
        style={{
          height: viewportHeight > 0 ? `${viewportHeight}px` : "100dvh",
          minHeight: viewportHeight > 0 ? `${viewportHeight}px` : "100vh",
          maxHeight: viewportHeight > 0 ? `${viewportHeight}px` : "100dvh",
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </VisuallyHidden>
        <div className="relative h-full w-full min-w-0 flex-1 overflow-hidden">
          {outgoingItem && navDirection && !reduceMotion ? (
            <div className="relative h-full w-full overflow-hidden">
              <div
                className="lightbox-nav-strip flex h-full w-[200%] will-change-transform"
                style={{
                  transform:
                    navDirection === "next"
                      ? shouldAnimateStrip
                        ? "translate3d(-50%, 0, 0)"
                        : "translate3d(0, 0, 0)"
                      : shouldAnimateStrip
                        ? "translate3d(0, 0, 0)"
                        : "translate3d(-50%, 0, 0)",
                  transition: shouldAnimateStrip
                    ? `transform ${STRIP_TRANSITION_MS}ms ease-out`
                    : "none",
                  WebkitBackfaceVisibility: "hidden",
                  backfaceVisibility: "hidden",
                }}
                onTransitionEnd={handleStripTransitionEnd}
              >
                {navDirection === "next" ? (
                  <>
                    {renderSlideColumn(outgoingItem, "outgoing", "strip")}
                    {renderSlideColumn(item, "incoming", "strip")}
                  </>
                ) : (
                  <>
                    {renderSlideColumn(item, "incoming", "strip")}
                    {renderSlideColumn(outgoingItem, "outgoing", "strip")}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div
              key={item.id}
              className="lightbox-slide-panel h-full w-full min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              {renderSlideColumn(item, "single", "full")}
            </div>
          )}
        </div>

        {/* Prev/Next navigation buttons */}
        <TooltipProvider delayDuration={300}>
          {onGoToPrevious != null && (
            <div
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2"
              style={{
                left: "max(1rem, env(safe-area-inset-left, 0px) + 1rem)",
              }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <CarouselNavButton
                    side="prev"
                    overlayDark
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGoToPrevious();
                    }}
                    disabled={!hasPrevious || inNavTransition}
                    aria-label={navigation?.prevLabel || "Previous"}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{navigation?.prevLabel || "Previous"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
          {onGoToNext != null && (
            <div
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2"
              style={{
                right: "max(1rem, env(safe-area-inset-right, 0px) + 1rem)",
              }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <CarouselNavButton
                    side="next"
                    overlayDark
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGoToNext();
                    }}
                    disabled={!hasNext || inNavTransition}
                    aria-label={navigation?.nextLabel || "Next"}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{navigation?.nextLabel || "Next"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </TooltipProvider>

        {/* Control buttons */}
        {renderControls && (
          <TooltipProvider delayDuration={300}>
            <div
              className="absolute z-10 flex flex-col items-end gap-2"
              style={{
                bottom: controlStackBottom,
                right: "max(1rem, env(safe-area-inset-right, 0px) + 1rem)",
              }}
            >
              {renderControls(chromeContext)}
            </div>
          </TooltipProvider>
        )}

        {renderBottomLeading && (
          <div
            className="pointer-events-none absolute z-10 max-w-[min(20rem,calc(100vw-5.5rem))] text-left xl:hidden"
            style={{
              bottom: controlStackBottom,
              left: "max(1rem, env(safe-area-inset-left, 0px) + 1rem)",
            }}
          >
            {renderBottomLeading(chromeContext)}
          </div>
        )}

        {/* Text Overlay Modal */}
        {isTextOverlayOpen && hasText && renderTextOverlay && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
            onClick={() => setIsTextOverlayOpen(false)}
          >
            <div
              className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-zinc-900 border border-zinc-700 p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {renderTextOverlay(chromeContext)}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
