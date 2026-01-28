"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  VisuallyHidden,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Heart,
  X,
  FileText,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useTrackSubmissionView } from "@/lib/hooks/use-track-submission-view";
import { useViewportHeight } from "@/lib/hooks/use-viewport-height";
import { usePinchZoom } from "@/lib/hooks/use-pinch-zoom";
import { buildRoutePath } from "@/lib/routes";

interface LightboxSubmission {
  id: string;
  title: string | null;
  imageUrl: string | null;
  text: string | null;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
    slug?: string | null;
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
  /** Whether to enable download protection. Default: true */
  protectionEnabled?: boolean;
  /** Current logged-in user ID. If provided, edit button will show for owned submissions. */
  currentUserId?: string | null;
  /** When provided, enables previous submission navigation (e.g. from a gallery). */
  onGoToPrevious?: () => void;
  /** When provided, enables next submission navigation. */
  onGoToNext?: () => void;
  /** When false, previous button is disabled (e.g. at first item). Defaults to true when onGoToPrevious is set. */
  hasPrevious?: boolean;
  /** When false, next button is disabled (e.g. at last item). Defaults to true when onGoToNext is set. */
  hasNext?: boolean;
}

export function SubmissionLightbox({
  submission,
  onClose,
  isOpen,
  hideGoToSubmission = false,
  protectionEnabled = true,
  currentUserId: propCurrentUserId,
  onGoToPrevious,
  onGoToNext,
  hasPrevious = onGoToPrevious !== undefined,
  hasNext = onGoToNext !== undefined,
}: SubmissionLightboxProps) {
  const t = useTranslations("exhibition");
  const { data: session } = useSession();
  // Use session user ID if available, otherwise fall back to prop
  const currentUserId = session?.user?.id || propCurrentUserId;
  const [zoomState, setZoomState] = useState<{
    isActive: boolean;
    x: number;
    y: number;
    imageRect: DOMRect | null;
  }>({ isActive: false, x: 0, y: 0, imageRect: null });
  const [supportsHover, setSupportsHover] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isTextOverlayOpen, setIsTextOverlayOpen] = useState(false);
  const [closeTooltipOpen, setCloseTooltipOpen] = useState(false);
  const [closeTooltipHovered, setCloseTooltipHovered] = useState(false);
  const router = useRouter();
  const imageRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const viewportHeight = useViewportHeight();
  const [submissionUserId, setSubmissionUserId] = useState<string | null>(
    submission.user?.id || null,
  );
  const [submissionUserSlug, setSubmissionUserSlug] = useState<string | null>(
    submission.user?.slug || null,
  );

  // Pinch-to-zoom hook for mobile
  const {
    touchZoom,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    setBaseDimensions,
  } = usePinchZoom({
    supportsHover,
    imageRef,
    imageContainerRef,
  });
  const hasImage = !!submission.imageUrl;
  const hasText = !!submission.text;
  const isOwner =
    !!currentUserId &&
    !!submission.user?.id &&
    currentUserId === submission.user.id;

  // Get favorite count - handle both _count and direct favoriteCount
  const favoriteCount =
    submission._count?.favorites ?? (submission as any).favoriteCount ?? 0;

  // Check if device supports hover (not touch) - use effect to handle SSR
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSupportsHover(window.matchMedia("(hover: hover)").matches);
    }
  }, []);

  // Fetch submission userId and slug if not available
  useEffect(() => {
    if (!submissionUserId && submission.id) {
      const fetchUserInfo = async () => {
        try {
          const response = await fetch(`/api/submissions/${submission.id}`);
          if (response.ok) {
            const data = await response.json();
            setSubmissionUserId(data.submission.userId);
            // If user info is included, also get the slug
            if (data.submission.user?.slug) {
              setSubmissionUserSlug(data.submission.user.slug);
            }
          }
        } catch {
          // Silently fail
        }
      };
      fetchUserInfo();
    }
  }, [submissionUserId, submission.id]);

  // Get creator ID for route building (slug if available, otherwise ID)
  const getCreatorId = (): string | null => {
    if (submission.user?.id) {
      // Use slug if available, otherwise use ID
      return submission.user.slug || submission.user.id;
    }
    // Fallback to fetched slug or userId
    return submissionUserSlug || submissionUserId;
  };

  // Build submission URL using routes
  const getSubmissionUrl = (): string | null => {
    const creatorId = getCreatorId();
    if (!creatorId || !submission.id) return null;
    return buildRoutePath("submission", {
      creatorid: creatorId,
      submissionid: submission.id,
    });
  };

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

  // Handle ArrowLeft/ArrowRight for previous/next when callbacks provided and text overlay closed
  useEffect(() => {
    if (!isOpen || isTextOverlayOpen) return;

    const handleArrow = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && onGoToPrevious && hasPrevious) {
        e.preventDefault();
        onGoToPrevious();
      } else if (e.key === "ArrowRight" && onGoToNext && hasNext) {
        e.preventDefault();
        onGoToNext();
      }
    };
    window.addEventListener("keydown", handleArrow);
    return () => window.removeEventListener("keydown", handleArrow);
  }, [
    isOpen,
    isTextOverlayOpen,
    onGoToPrevious,
    onGoToNext,
    hasPrevious,
    hasNext,
  ]);

  // Control close button tooltip to only show on hover, not focus
  useEffect(() => {
    if (closeTooltipHovered) {
      const timer = setTimeout(() => setCloseTooltipOpen(true), 300);
      return () => clearTimeout(timer);
    } else {
      setCloseTooltipOpen(false);
    }
  }, [closeTooltipHovered]);

  // Track view when lightbox opens (only if not the owner)
  useTrackSubmissionView(submission.id, isOwner, isOpen);

  // Navigate to edit page
  const handleEditClick = () => {
    const creatorId = getCreatorId();
    if (creatorId && submission.id) {
      router.push(
        buildRoutePath("submissionEdit", {
          creatorid: creatorId,
          submissionid: submission.id,
        }),
      );
    }
    // Note: If creator info is missing, we can't construct the route - this shouldn't happen
  };

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

    // Check if sidebar is visible (xl+ breakpoint, 1280px+)
    const isSidebarVisible = window.innerWidth >= 1280 && sidebarRef.current;

    if (isSidebarVisible && sidebarRef.current) {
      // Position in sidebar - relative to sidebar container
      // Sidebar is 400px wide, add margins on both sides
      const leftMargin = 16;
      const rightMargin = 16;
      const availableWidth = 400 - leftMargin - rightMargin; // 368px available
      const zoomSize = Math.min(ZOOM_PREVIEW_SIZE, availableWidth);

      return {
        position: "absolute" as const,
        backgroundImage: `url(${submission.imageUrl})`,
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

    // Overlay mode - position fixed in top-left corner
    const margin = 20;
    return {
      position: "fixed" as const,
      backgroundImage: `url(${submission.imageUrl})`,
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
        className="w-screen max-w-none max-h-none border-none bg-black/90 p-0 [&>button:last-child]:hidden overflow-hidden md:overflow-hidden"
        style={{
          height: viewportHeight > 0 ? `${viewportHeight}px` : "100dvh",
          minHeight: viewportHeight > 0 ? `${viewportHeight}px` : "100vh",
          maxHeight: viewportHeight > 0 ? `${viewportHeight}px` : "100dvh",
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>
            {submission.title || "Submission"}{" "}
            {submission.user?.name ? `by ${submission.user.name}` : ""}
          </DialogTitle>
        </VisuallyHidden>
        <div
          className={`flex h-full w-full p-0 overflow-y-auto md:overflow-hidden ${
            hasImage ? "flex-col xl:flex-row" : "flex-col"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image section */}
          {hasImage && (
            <div
              ref={imageContainerRef}
              className="protected-image-wrapper relative flex h-full flex-1 items-center justify-center overflow-hidden"
              style={{
                // Allow panning but prevent page zoom
                touchAction: supportsHover ? "none" : "pan-x pan-y",
              }}
              onContextMenu={handleContextMenu}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={submission.imageUrl!}
                alt={submission.title || "Submission"}
                className="h-auto w-auto max-h-[100dvh] max-w-full object-contain select-none"
                style={{
                  maxHeight:
                    viewportHeight > 0 ? `${viewportHeight}px` : "100dvh",
                  maxWidth: "100%",
                  // Apply touch zoom transforms only on mobile
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
                  // Store base image dimensions when image loads (before any transforms)
                  setBaseDimensions();
                }}
                onMouseMove={handleImageMouseMove}
                onMouseLeave={handleImageMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
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
          {hasImage && (
            <div
              ref={sidebarRef}
              className="hidden xl:flex xl:w-[400px] xl:flex-shrink-0 xl:flex-col xl:overflow-hidden xl:border-l xl:border-border/50 xl:bg-black/40"
            >
              {/* Zoom preview window - near top when zooming */}
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

              {/* Title and creator - always shown at top */}
              <div className="flex-shrink-0 p-6 xl:p-8 pb-4">
                <h2 className="mb-2 text-2xl font-semibold text-muted-foreground">
                  {submission.title || t("untitled")}
                </h2>
                {submission.user?.name && (
                  <p className="text-sm text-muted-foreground/70 mb-2">
                    {submission.user.name}
                  </p>
                )}
                {favoriteCount > 0 && (
                  <div className="flex items-center gap-1.5 text-muted-foreground/70">
                    <Heart className="h-4 w-4 fill-red-400 text-red-400" />
                    <span className="text-sm">{favoriteCount}</span>
                  </div>
                )}
              </div>

              {/* Text content - below title */}
              {hasText && (
                <div className="flex-1 overflow-y-auto px-6 xl:px-8 pb-6 xl:pb-8">
                  <div
                    className="prose prose-lg prose-invert max-w-none text-muted-foreground prose-headings:text-muted-foreground prose-p:text-muted-foreground prose-strong:text-muted-foreground prose-em:text-muted-foreground prose-a:text-muted-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-li:text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: submission.text! }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Text-only section */}
          {hasText && !hasImage && (
            <div className="relative flex h-full w-full flex-1 items-center justify-center overflow-y-auto p-8 sm:p-12">
              <div className="mx-auto w-full max-w-4xl">
                {submission.title && (
                  <h2 className="mb-6 text-3xl font-semibold text-muted-foreground sm:text-4xl">
                    {submission.title}
                  </h2>
                )}
                <div
                  className="prose prose-lg prose-invert max-w-none text-muted-foreground prose-headings:text-muted-foreground prose-p:text-muted-foreground prose-strong:text-muted-foreground prose-em:text-muted-foreground prose-a:text-muted-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-li:text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: submission.text! }}
                />
              </div>
            </div>
          )}

          {/* Image metadata overlay - hidden when sidebar is visible (xl+) */}
          {hasImage && (
            <div
              className="absolute left-4 right-4 z-10 rounded-xl bg-black/70 px-4 py-3 backdrop-blur-sm sm:left-8 sm:right-8 sm:px-6 sm:py-4 xl:hidden"
              style={{
                // Position at top, but add offset when zoom indicator is visible
                top:
                  !supportsHover && touchZoom.isZoomed
                    ? `max(4.5rem, calc(env(safe-area-inset-top, 0px) + 4.5rem))`
                    : `max(1rem, env(safe-area-inset-top, 0px) + 1rem)`,
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

          {/* Text-only metadata overlay - top on mobile only */}
          {hasText && !hasImage && (
            <div
              className="absolute left-4 right-4 z-10 rounded-xl bg-black/70 px-4 py-3 backdrop-blur-sm sm:left-8 sm:right-8 sm:px-6 sm:py-4 xl:hidden"
              style={{
                top: `max(1rem, env(safe-area-inset-top, 0px) + 1rem)`,
              }}
            >
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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

        {/* Prev/Next - left and right edges, vertically centered */}
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
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasPrevious) onGoToPrevious();
                    }}
                    disabled={!hasPrevious}
                    aria-label={t("previousSubmission")}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("previousSubmission")}</p>
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
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasNext) onGoToNext();
                    }}
                    disabled={!hasNext}
                    aria-label={t("nextSubmission")}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("nextSubmission")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </TooltipProvider>

        {/* Buttons - lower right corner, absolute positioned */}
        <TooltipProvider delayDuration={300}>
          <div
            className="absolute right-4 z-10 flex items-center gap-2"
            style={{
              // Calculate bottom position to ensure buttons are always visible
              // Account for safe area insets and ensure buttons are above browser UI
              // On mobile, add extra padding to account for browser UI that may overlay
              bottom:
                typeof window !== "undefined" && window.innerWidth < 768
                  ? `max(2rem, calc(env(safe-area-inset-bottom, 0px) + 2rem))`
                  : `max(1rem, env(safe-area-inset-bottom, 0px) + 1rem)`,
            }}
          >
            {/* Text overlay button - shown in overlay mode (< xl) when text exists */}
            {hasText && hasImage && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsTextOverlayOpen(true);
                    }}
                    className="xl:hidden"
                    aria-label="View text"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View text</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Edit button - shown if user owns the submission */}
            {isOwner && (
              <>
                {/* Full button on xl+ */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick();
                      }}
                      className="hidden xl:flex"
                      aria-label="Edit submission"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit submission</p>
                  </TooltipContent>
                </Tooltip>
                {/* Icon button on < xl */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick();
                      }}
                      className="xl:hidden"
                      aria-label="Edit submission"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit submission</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}

            {/* View Submission button */}
            {!hideGoToSubmission && (
              <>
                {/* Full button on xl+ */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="hidden xl:flex"
                    >
                      <Link
                        href={getSubmissionUrl() || "#"}
                        onClick={(e) => {
                          e.stopPropagation();
                          // If we don't have a URL yet, try to navigate programmatically
                          const url = getSubmissionUrl();
                          if (!url && submissionUserId && submission.id) {
                            e.preventDefault();
                            router.push(
                              buildRoutePath("submission", {
                                creatorid: submissionUserId,
                                submissionid: submission.id,
                              }),
                            );
                          }
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View full submission page</p>
                  </TooltipContent>
                </Tooltip>
                {/* Icon button on < xl */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      asChild
                      className="xl:hidden"
                      aria-label="View submission"
                    >
                      <Link
                        href={getSubmissionUrl() || "#"}
                        onClick={(e) => {
                          e.stopPropagation();
                          // If we don't have a URL yet, try to navigate programmatically
                          const url = getSubmissionUrl();
                          if (!url && submissionUserId && submission.id) {
                            e.preventDefault();
                            router.push(
                              buildRoutePath("submission", {
                                creatorid: submissionUserId,
                                submissionid: submission.id,
                              }),
                            );
                          }
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View submission</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}

            {/* Close button */}
            <Tooltip open={closeTooltipOpen} onOpenChange={() => {}}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onClose}
                  onMouseEnter={() => setCloseTooltipHovered(true)}
                  onMouseLeave={() => setCloseTooltipHovered(false)}
                  className="xl:h-9 xl:w-auto xl:px-3 xl:gap-2"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden xl:inline">Close</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Close lightbox</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

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
                className="absolute right-4 top-4"
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
