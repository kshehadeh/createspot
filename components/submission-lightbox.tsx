"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  VisuallyHidden,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, X } from "lucide-react";

interface LightboxSubmission {
  id: string;
  title: string | null;
  imageUrl: string | null;
  text: string | null;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count?: {
    favorites: number;
  };
}

interface SubmissionLightboxProps {
  submission: LightboxSubmission;
  word: string;
  onClose: () => void;
  isOpen: boolean;
  /** Hide the "Go To Submission" button (e.g., when already on the submission page) */
  hideGoToSubmission?: boolean;
}

export function SubmissionLightbox({
  submission,
  onClose,
  isOpen,
  hideGoToSubmission = false,
}: SubmissionLightboxProps) {
  const [zoomState, setZoomState] = useState<{
    isActive: boolean;
    x: number;
    y: number;
    imageRect: DOMRect | null;
  }>({ isActive: false, x: 0, y: 0, imageRect: null });
  const [supportsHover, setSupportsHover] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isTextOverlayOpen, setIsTextOverlayOpen] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const hasImage = !!submission.imageUrl;
  const hasText = !!submission.text;

  // Get favorite count - handle both _count and direct favoriteCount
  const favoriteCount =
    submission._count?.favorites ?? (submission as any).favoriteCount ?? 0;

  // Check if device supports hover (not touch) - use effect to handle SSR
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

  const handleImageMouseMove = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      if (!supportsHover || !imageRef.current || !imageLoaded) return;

      const imageRect = imageRef.current.getBoundingClientRect();

      // Calculate mouse position relative to the image
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

  // Calculate zoom preview position and background
  const ZOOM_SQUARE_SIZE = 200;
  const ZOOM_PREVIEW_SIZE = 400;
  // Zoom level is the ratio of preview to square - this ensures
  // the preview shows exactly what's inside the square, magnified to fill it
  const ZOOM_LEVEL = ZOOM_PREVIEW_SIZE / ZOOM_SQUARE_SIZE; // = 2x

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

    // Don't show zoom preview if image is too small
    if (imageWidth < ZOOM_SQUARE_SIZE || imageHeight < ZOOM_SQUARE_SIZE) {
      return { display: "none" };
    }

    // Get the clamped position to calculate correct zoom area
    const halfSize = ZOOM_SQUARE_SIZE / 2;
    const clampedX = Math.max(
      halfSize,
      Math.min(imageWidth - halfSize, zoomState.x),
    );
    const clampedY = Math.max(
      halfSize,
      Math.min(imageHeight - halfSize, zoomState.y),
    );

    // Calculate background size in pixels - scale the DISPLAYED image by zoom level
    // This ensures the zoom matches exactly what's shown on screen
    const bgWidth = imageWidth * ZOOM_LEVEL;
    const bgHeight = imageHeight * ZOOM_LEVEL;

    // Calculate background position to center the cursor position in the preview
    // The zoomed cursor position is (clampedX * ZOOM_LEVEL, clampedY * ZOOM_LEVEL)
    // We want that point to be at the center of the preview (PREVIEW_SIZE / 2)
    const bgPosX = ZOOM_PREVIEW_SIZE / 2 - clampedX * ZOOM_LEVEL;
    const bgPosY = ZOOM_PREVIEW_SIZE / 2 - clampedY * ZOOM_LEVEL;

    // Calculate zoom preview position (avoid top-right where close button is)
    // Always position in top-left corner for consistency
    const margin = 20;
    const previewX = margin;
    const previewY = margin;

    return {
      position: "fixed" as const,
      backgroundImage: `url(${submission.imageUrl})`,
      backgroundSize: `${bgWidth}px ${bgHeight}px`,
      backgroundPosition: `${bgPosX}px ${bgPosY}px`,
      backgroundRepeat: "no-repeat",
      backgroundColor: "#000",
      left: `${previewX}px`,
      top: `${previewY}px`,
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

    // Calculate square position relative to container
    const imageLeft = imageRect.left - containerRect.left;
    const imageTop = imageRect.top - containerRect.top;

    // Clamp square position to stay within image bounds
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

    // Only show zoom if image is large enough
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-screen max-w-none max-h-none border-none bg-black/90 p-0 [&>button:last-child]:hidden overflow-hidden"
        style={{ height: "100dvh", minHeight: "100vh" }}
      >
        <VisuallyHidden>
          <DialogTitle>
            {submission.title || "Submission"}{" "}
            {submission.user?.name ? `by ${submission.user.name}` : ""}
          </DialogTitle>
        </VisuallyHidden>
        <div
          className="absolute right-4 z-10 flex flex-col items-end gap-2"
          style={{ top: `max(3.5rem, env(safe-area-inset-top, 0px) + 1rem)` }}
        >
          <div className="flex flex-col items-end gap-1 rounded-lg bg-black/60 px-3 py-2 backdrop-blur-sm">
            {hasText && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTextOverlayOpen(true);
                }}
                className="text-sm font-medium text-white/80 transition-colors hover:text-white"
              >
                View Text →
              </button>
            )}
            {!hideGoToSubmission && (
              <Link
                href={`/s/${submission.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sm font-medium text-white/80 transition-colors hover:text-white"
              >
                View Submission →
              </Link>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-black/60 px-3 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:text-white"
          >
            Close
          </button>
        </div>

        <div
          className="flex h-full w-full flex-col p-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image section */}
          {hasImage && (
            <div
              ref={imageContainerRef}
              className="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden touch-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={submission.imageUrl!}
                alt={submission.title || "Submission"}
                className="max-h-[100dvh] max-w-[100vw] h-auto w-auto object-contain select-none"
                style={{ maxHeight: "100dvh", maxWidth: "100vw" }}
                onLoad={() => setImageLoaded(true)}
                onMouseMove={handleImageMouseMove}
                onMouseLeave={handleImageMouseLeave}
                draggable={false}
              />

              {/* Zoom square overlay */}
              {zoomState.isActive && supportsHover && (
                <div
                  className="pointer-events-none absolute z-20 border-2 border-white bg-white/10"
                  style={{
                    width: `${ZOOM_SQUARE_SIZE}px`,
                    height: `${ZOOM_SQUARE_SIZE}px`,
                    ...getZoomSquareStyle(),
                  }}
                />
              )}

              {/* Zoom preview box */}
              {zoomState.isActive && supportsHover && (
                <div
                  className="pointer-events-none z-50 border-2 border-white/90 shadow-2xl"
                  style={{
                    width: `${ZOOM_PREVIEW_SIZE}px`,
                    height: `${ZOOM_PREVIEW_SIZE}px`,
                    ...getZoomPreviewStyle(),
                  }}
                />
              )}
            </div>
          )}

          {/* Image metadata overlay */}
          {hasImage && (
            <div
              className="absolute right-4 left-4 z-10 rounded-xl bg-black/70 px-4 py-3 backdrop-blur-sm sm:right-8 sm:left-auto sm:px-6 sm:py-4"
              style={{
                bottom: `max(1rem, env(safe-area-inset-bottom, 0px) + 1rem)`,
              }}
            >
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-white font-medium text-sm sm:text-base">
                  {submission.title || "Untitled"}
                </span>
                {submission.user && (
                  <span className="text-zinc-300 text-xs sm:text-sm">
                    {submission.user.name || "Anonymous"}
                  </span>
                )}
                {favoriteCount > 0 && (
                  <div className="flex items-center gap-1.5 text-white">
                    <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-red-400 text-red-400" />
                    <span className="text-xs sm:text-sm">{favoriteCount}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Text Overlay */}
        {isTextOverlayOpen && hasText && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
            onClick={() => setIsTextOverlayOpen(false)}
          >
            <div
              className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-zinc-900 border border-zinc-700 p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {submission.title && (
                <h2 className="mb-4 text-2xl font-semibold text-white">
                  {submission.title}
                </h2>
              )}
              <div
                className="prose prose-lg prose-invert max-w-none text-white"
                dangerouslySetInnerHTML={{ __html: submission.text! }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsTextOverlayOpen(false)}
                className="absolute right-4 top-4 rounded-full bg-white/20 text-white hover:bg-white/30"
                aria-label="Close text overlay"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
