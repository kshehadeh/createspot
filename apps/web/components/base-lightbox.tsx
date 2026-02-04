"use client";

import { useState, useRef, useCallback, useEffect, ReactNode } from "react";
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

/** Shared style for lightbox controls: semi-transparent on black, capsule shape. */
export const LIGHTBOX_BUTTON_CLASS =
  "rounded-full !bg-white/10 border border-white/20 text-white hover:!bg-white/20 hover:!text-white focus-visible:ring-white/30 focus-visible:ring-offset-transparent";

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
  /** Render function for text overlay modal content */
  renderTextOverlay?: (context: BaseLightboxRenderContext) => ReactNode;
  /** Callback when item changes (for tracking, etc.) */
  onItemChange?: (itemId: string) => void;
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
  renderTextOverlay,
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
  // Slide transition state for iOS-compatible animations
  const [slideState, setSlideState] = useState<{
    direction: "left" | "right" | null;
    phase: "start" | "end";
  }>({ direction: null, phase: "end" });
  const prevItemIdRef = useRef<string | null>(null);
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

  // Wrapped nav handlers: set slide direction then call parent
  const handleGoToPrevious = useCallback(() => {
    if (!hasPrevious || !onGoToPrevious) return;
    setSlideState({ direction: "left", phase: "start" });
    onGoToPrevious();
  }, [hasPrevious, onGoToPrevious]);

  const handleGoToNext = useCallback(() => {
    if (!hasNext || !onGoToNext) return;
    setSlideState({ direction: "right", phase: "start" });
    onGoToNext();
  }, [hasNext, onGoToNext]);

  const hasNavigation =
    onGoToPrevious != null && onGoToNext != null && (hasPrevious || hasNext);
  const canSwipeToNavigate =
    !supportsHover && hasNavigation && !touchZoom.isZoomed;

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
  const canSwipeTextOnly = !supportsHover && hasNavigation;

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

  const hasImage = !!item.imageUrl;
  const hasText = !!item.text;

  // Check if device supports hover (not touch)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSupportsHover(window.matchMedia("(hover: hover)").matches);
    }
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

  // iOS Safari fix: use CSS transitions with explicit start/end phases
  useEffect(() => {
    const prevId = prevItemIdRef.current;
    prevItemIdRef.current = item.id;

    if (
      prevId !== null &&
      prevId !== item.id &&
      slideState.direction &&
      slideState.phase === "start"
    ) {
      let cancelled = false;
      const timer = setTimeout(() => {
        if (cancelled) return;
        setSlideState((s) => ({ ...s, phase: "end" }));
      }, 20);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
  }, [item.id, slideState.direction, slideState.phase]);

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

  const getZoomPreviewStyle = (): React.CSSProperties => {
    if (
      !zoomState.isActive ||
      !zoomState.imageRect ||
      !imageRef.current ||
      typeof window === "undefined"
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
        backgroundImage: `url(${item.imageUrl})`,
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
      backgroundImage: `url(${item.imageUrl})`,
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

  // Create render context
  const renderContext: BaseLightboxRenderContext = {
    supportsHover,
    touchZoom,
    viewportHeight,
    isTextOverlayOpen,
    setIsTextOverlayOpen,
  };

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
          <div
            key={item.id}
            className={`flex h-full w-full p-0 overflow-y-auto md:overflow-hidden ${
              hasImage ? "flex-col xl:flex-row" : "flex-col"
            } ${slideState.direction ? "lightbox-slide-panel" : ""}`}
            style={
              slideState.direction
                ? {
                    transform:
                      slideState.phase === "start"
                        ? `translate3d(${slideState.direction === "right" ? "100%" : "-100%"}, 0, 0)`
                        : "translate3d(0, 0, 0)",
                    transition:
                      slideState.phase === "end"
                        ? "transform 0.28s ease-out"
                        : "none",
                  }
                : undefined
            }
            onClick={(e) => e.stopPropagation()}
            onTransitionEnd={() =>
              setSlideState({ direction: null, phase: "end" })
            }
          >
            {/* Image section */}
            {hasImage && (
              <div
                ref={imageContainerRef}
                className="protected-image-wrapper relative flex h-full flex-1 items-center justify-center overflow-hidden"
                style={{
                  touchAction: supportsHover ? "none" : "pan-x pan-y",
                }}
                onContextMenu={handleContextMenu}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={item.imageUrl!}
                  alt={item.title || "Image"}
                  className="h-auto w-auto max-h-[100dvh] max-w-full object-contain select-none"
                  style={{
                    maxHeight:
                      viewportHeight > 0 ? `${viewportHeight}px` : "100dvh",
                    maxWidth: "100%",
                    ...(!supportsHover && touchZoom.isZoomed
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
                  onLoad={() => {
                    setImageLoaded(true);
                    setBaseDimensions();
                  }}
                  onMouseMove={handleImageMouseMove}
                  onMouseLeave={handleImageMouseLeave}
                  onTouchStart={handleTouchStartWithSwipe}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEndWithSwipe}
                  draggable={!protectionEnabled}
                  onDragStart={handleDragStart}
                />

                {/* Zoom square overlay - only shown when NOT in sidebar mode */}
                {zoomState.isActive && supportsHover && (
                  <div
                    className="pointer-events-none absolute z-20 border-2 border-white bg-white/10 xl:hidden"
                    style={{
                      width: `${ZOOM_SQUARE_SIZE}px`,
                      height: `${ZOOM_SQUARE_SIZE}px`,
                      ...getZoomSquareStyle(),
                    }}
                  />
                )}

                {/* Zoom preview box - overlay mode (when sidebar not visible) */}
                {zoomState.isActive && supportsHover && (
                  <div
                    className="pointer-events-none z-50 border-2 border-white/90 shadow-2xl xl:hidden"
                    style={{
                      width: `${ZOOM_PREVIEW_SIZE}px`,
                      height: `${ZOOM_PREVIEW_SIZE}px`,
                      ...getZoomPreviewStyle(),
                    }}
                  />
                )}

                {/* Zoom percentage indicator - mobile only */}
                {!supportsHover && touchZoom.isZoomed && (
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

            {/* Sidebar - shown on xl+ screens when image exists */}
            {hasImage && renderSidebar && (
              <div
                ref={sidebarRef}
                className="hidden xl:flex xl:w-[400px] xl:flex-shrink-0 xl:flex-col xl:overflow-hidden xl:border-l xl:border-border/50 xl:bg-black/40"
              >
                {/* Zoom preview window in sidebar */}
                {zoomState.isActive && supportsHover && (
                  <div className="relative flex-shrink-0 p-4">
                    <div
                      className="border-2 border-white/90 shadow-2xl"
                      style={{
                        width: `${ZOOM_PREVIEW_SIZE}px`,
                        height: `${ZOOM_PREVIEW_SIZE}px`,
                        ...getZoomPreviewStyle(),
                      }}
                    />
                  </div>
                )}
                {renderSidebar(renderContext)}
              </div>
            )}

            {/* Text-only section */}
            {hasText && !hasImage && (
              <div
                className="relative flex h-full w-full flex-1 items-center justify-center overflow-y-auto p-8 sm:p-12"
                style={{
                  touchAction: supportsHover ? "auto" : "pan-y",
                }}
                onTouchStart={handleTextTouchStart}
                onTouchEnd={handleTextTouchEnd}
              >
                <div className="mx-auto w-full max-w-4xl">
                  {item.title && (
                    <h2 className="mb-6 text-3xl font-semibold text-muted-foreground sm:text-4xl">
                      {item.title}
                    </h2>
                  )}
                  <div
                    className="prose prose-lg prose-invert max-w-none text-muted-foreground prose-headings:text-muted-foreground prose-p:text-muted-foreground prose-strong:text-muted-foreground prose-em:text-muted-foreground prose-a:text-muted-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-li:text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: item.text! }}
                  />
                </div>
              </div>
            )}

            {/* Metadata overlay - mobile */}
            {renderMetadataOverlay && (
              <div
                className="absolute left-4 right-4 z-10 rounded-xl bg-black/70 px-4 py-3 backdrop-blur-sm sm:left-8 sm:right-8 sm:px-6 sm:py-4 xl:hidden"
                style={{
                  top:
                    !supportsHover && touchZoom.isZoomed
                      ? `max(4.5rem, calc(env(safe-area-inset-top, 0px) + 4.5rem))`
                      : `max(1rem, env(safe-area-inset-top, 0px) + 1rem)`,
                }}
              >
                {renderMetadataOverlay(renderContext)}
              </div>
            )}
          </div>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGoToPrevious();
                    }}
                    disabled={!hasPrevious}
                    aria-label={navigation?.prevLabel || "Previous"}
                    className={LIGHTBOX_BUTTON_CLASS}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGoToNext();
                    }}
                    disabled={!hasNext}
                    aria-label={navigation?.nextLabel || "Next"}
                    className={LIGHTBOX_BUTTON_CLASS}
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
              className="absolute right-4 z-10 flex items-center gap-2"
              style={{
                bottom:
                  typeof window !== "undefined" && window.innerWidth < 768
                    ? `max(2rem, calc(env(safe-area-inset-bottom, 0px) + 2rem))`
                    : `max(1rem, env(safe-area-inset-bottom, 0px) + 1rem)`,
              }}
            >
              {renderControls(renderContext)}
            </div>
          </TooltipProvider>
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
              {renderTextOverlay(renderContext)}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
