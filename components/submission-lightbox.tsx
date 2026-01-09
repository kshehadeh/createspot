"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  word,
  onClose,
  isOpen,
  hideGoToSubmission = false,
}: SubmissionLightboxProps) {
  const [mobileView, setMobileView] = useState<"image" | "text">("image");
  const [zoomState, setZoomState] = useState<{
    isActive: boolean;
    x: number;
    y: number;
    imageRect: DOMRect | null;
  }>({ isActive: false, x: 0, y: 0, imageRect: null });
  const [supportsHover, setSupportsHover] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const hasImage = !!submission.imageUrl;
  const hasText = !!submission.text;
  const hasBoth = hasImage && hasText;
  const isImageOnly = hasImage && !hasText;

  // Get favorite count - handle both _count and direct favoriteCount
  const favoriteCount =
    submission._count?.favorites ?? (submission as any).favoriteCount ?? 0;

  // Check if device supports hover (not touch) - use effect to handle SSR
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSupportsHover(window.matchMedia("(hover: hover)").matches);
    }
  }, []);

  const handleImageMouseMove = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
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
  }, [supportsHover, imageLoaded]);

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
    if (!zoomState.isActive || !zoomState.imageRect || !imageRef.current || typeof window === "undefined") {
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
    const clampedX = Math.max(halfSize, Math.min(imageWidth - halfSize, zoomState.x));
    const clampedY = Math.max(halfSize, Math.min(imageHeight - halfSize, zoomState.y));
    
    // Calculate background size in pixels - scale the DISPLAYED image by zoom level
    // This ensures the zoom matches exactly what's shown on screen
    const bgWidth = imageWidth * ZOOM_LEVEL;
    const bgHeight = imageHeight * ZOOM_LEVEL;
    
    // Calculate background position to center the cursor position in the preview
    // The zoomed cursor position is (clampedX * ZOOM_LEVEL, clampedY * ZOOM_LEVEL)
    // We want that point to be at the center of the preview (PREVIEW_SIZE / 2)
    const bgPosX = ZOOM_PREVIEW_SIZE / 2 - clampedX * ZOOM_LEVEL;
    const bgPosY = ZOOM_PREVIEW_SIZE / 2 - clampedY * ZOOM_LEVEL;
    
    // Calculate zoom preview position (prefer top-right corner of viewport)
    const margin = 20;
    const previewX = window.innerWidth - ZOOM_PREVIEW_SIZE - margin;
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
    if (!zoomState.isActive || !imageContainerRef.current || !zoomState.imageRect) return {};
    
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
        imageLeft + zoomState.x - halfSize
      )
    );
    const squareY = Math.max(
      imageTop,
      Math.min(
        imageTop + imageRect.height - ZOOM_SQUARE_SIZE,
        imageTop + zoomState.y - halfSize
      )
    );
    
    // Only show zoom if image is large enough
    if (imageRect.width < ZOOM_SQUARE_SIZE || imageRect.height < ZOOM_SQUARE_SIZE) {
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
        className={
          isImageOnly
            ? "w-screen h-screen max-w-none max-h-none border-none bg-black/90 p-0"
            : "max-w-[95vw] max-h-[95vh] border-none bg-black/90 p-0"
        }
      >
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          {!hideGoToSubmission && (
            <Button
              asChild
              variant="outline"
            >
              <Link href={`/s/${submission.id}`} onClick={(e) => e.stopPropagation()}>
                Go To Submission
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Mobile view with tabs */}
        {hasBoth && (
          <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 gap-2 md:hidden">
            <Tabs value={mobileView} onValueChange={(v) => setMobileView(v as "image" | "text")}>
              <TabsList className="bg-transparent">
                <TabsTrigger
                  value="image"
                  className="rounded-full data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=inactive]:bg-white/20 data-[state=inactive]:text-white"
                >
                  Image
                </TabsTrigger>
                <TabsTrigger
                  value="text"
                  className="rounded-full data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=inactive]:bg-white/20 data-[state=inactive]:text-white"
                >
                  Text
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        <div
          className={`flex h-full w-full flex-col ${
            isImageOnly ? "p-0" : "max-w-7xl p-4 md:flex-row md:items-center md:gap-6 md:p-8"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Image section */}
        {hasImage && (
          <div
            ref={imageContainerRef}
            className={`relative flex flex-1 items-center justify-center ${
              hasBoth ? "md:w-2/3" : "w-full"
            } ${hasBoth && mobileView === "text" ? "hidden md:flex" : ""} ${
              isImageOnly ? "h-screen" : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={submission.imageUrl!}
              alt={submission.title || "Submission"}
              className={
                isImageOnly
                  ? "max-h-[100vh] max-w-[100vw] object-contain"
                  : "max-h-[80vh] max-w-full rounded-lg object-contain"
              }
              onLoad={() => setImageLoaded(true)}
              onMouseMove={handleImageMouseMove}
              onMouseLeave={handleImageMouseLeave}
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

          {/* Text section */}
          {hasText && (
            <div
              className={`flex flex-col overflow-hidden ${
                hasBoth ? "md:w-1/3" : "w-full max-w-2xl"
              } ${hasBoth && mobileView === "image" ? "hidden md:flex" : ""} ${
                !hasImage ? "mx-auto" : ""
              }`}
            >
              <div className="max-h-[80vh] overflow-y-auto rounded-xl bg-white p-6 dark:bg-zinc-900">
                <div className="mb-4 flex items-center gap-2">
                  <Badge variant="secondary">{word}</Badge>
                  {favoriteCount > 0 && (
                    <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      <span>{favoriteCount}</span>
                    </div>
                  )}
                </div>
                {submission.title && (
                  <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
                    {submission.title}
                  </h2>
                )}
                <div
                  className="prose prose-zinc dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: submission.text! }}
                />
                {submission.user && (
                  <div className="mt-6 flex items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={submission.user.image || undefined} alt={submission.user.name || "User"} />
                      <AvatarFallback className="bg-zinc-200 dark:bg-zinc-700">
                        {submission.user.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {submission.user.name || "Anonymous"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Image-only metadata overlay */}
          {hasImage && !hasText && (
            <div className="absolute bottom-8 right-8 rounded-xl bg-black/70 px-6 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className="text-white font-medium">
                  {submission.title || "Untitled"}
                </span>
                {submission.user && (
                  <span className="text-zinc-300">
                    {submission.user.name || "Anonymous"}
                  </span>
                )}
                {favoriteCount > 0 && (
                  <div className="flex items-center gap-1.5 text-white">
                    <Heart className="h-4 w-4 fill-red-400 text-red-400" />
                    <span className="text-sm">{favoriteCount}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
