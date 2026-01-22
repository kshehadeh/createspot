import { useState, useRef, useCallback } from "react";

interface TouchZoomState {
  scale: number;
  translateX: number;
  translateY: number;
  isZoomed: boolean;
}

interface UsePinchZoomOptions {
  /** Whether the device supports hover (desktop) - zoom only works on touch devices */
  supportsHover: boolean;
  /** Ref to the image element */
  imageRef: React.RefObject<HTMLImageElement | null>;
  /** Ref to the image container element */
  imageContainerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Hook for handling pinch-to-zoom and pan gestures on mobile devices.
 *
 * Provides touch event handlers and zoom state for implementing
 * pinch-to-zoom functionality that doesn't affect page zoom.
 *
 * @param options - Configuration options
 * @returns Object containing zoom state and event handlers
 *
 * @example
 * const { touchZoom, handleTouchStart, handleTouchMove, handleTouchEnd, setBaseDimensions } = usePinchZoom({
 *   supportsHover: false,
 *   imageRef,
 *   imageContainerRef,
 * });
 */
export function usePinchZoom({
  supportsHover,
  imageRef,
  imageContainerRef,
}: UsePinchZoomOptions) {
  const [touchZoom, setTouchZoom] = useState<TouchZoomState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
    isZoomed: false,
  });

  // Touch gesture tracking refs
  const touchStartRef = useRef<{
    distance: number;
    centerX: number;
    centerY: number;
    translateX: number;
    translateY: number;
    scale: number;
  } | null>(null);
  const panStartRef = useRef<{
    clientX: number;
    clientY: number;
    translateX: number;
    translateY: number;
  } | null>(null);
  const lastTapRef = useRef<number>(0);
  const doubleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Store base image dimensions (before any transforms)
  const baseImageDimensionsRef = useRef<{
    width: number;
    height: number;
  } | null>(null);

  // Calculate distance between two touch points
  const getTouchDistance = (
    touch1: React.Touch,
    touch2: React.Touch,
  ): number => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calculate center point between two touches
  const getTouchCenter = (
    touch1: React.Touch,
    touch2: React.Touch,
  ): { x: number; y: number } => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  // Constrain pan values to keep image within bounds
  const constrainPan = useCallback(
    (
      scale: number,
      translateX: number,
      translateY: number,
    ): { translateX: number; translateY: number } => {
      if (!imageRef.current || !imageContainerRef.current || scale <= 1) {
        return { translateX: 0, translateY: 0 };
      }

      if (!baseImageDimensionsRef.current) {
        // Fallback: get dimensions from current state (may be inaccurate if already transformed)
        const imageRect = imageRef.current.getBoundingClientRect();
        baseImageDimensionsRef.current = {
          width: imageRect.width,
          height: imageRect.height,
        };
      }

      const container = imageContainerRef.current;
      const containerRect = container.getBoundingClientRect();

      // Use base dimensions (before transform)
      const baseWidth = baseImageDimensionsRef.current.width;
      const baseHeight = baseImageDimensionsRef.current.height;

      // Calculate scaled dimensions
      const scaledWidth = baseWidth * scale;
      const scaledHeight = baseHeight * scale;

      // Calculate bounds (how much the image extends beyond container)
      const maxTranslateX = Math.max(
        0,
        (scaledWidth - containerRect.width) / 2,
      );
      const maxTranslateY = Math.max(
        0,
        (scaledHeight - containerRect.height) / 2,
      );

      // Constrain translation
      const constrainedX = Math.max(
        -maxTranslateX,
        Math.min(maxTranslateX, translateX),
      );
      const constrainedY = Math.max(
        -maxTranslateY,
        Math.min(maxTranslateY, translateY),
      );

      return { translateX: constrainedX, translateY: constrainedY };
    },
    [imageRef, imageContainerRef],
  );

  // Set base image dimensions (call when image loads)
  const setBaseDimensions = useCallback(() => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      baseImageDimensionsRef.current = {
        width: rect.width,
        height: rect.height,
      };
    }
  }, [imageRef]);

  // Handle touch start for pinch-to-zoom
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLImageElement>) => {
      // Only handle on mobile (non-hover devices)
      if (supportsHover) return;

      const touches = e.touches;
      if (touches.length === 1) {
        const touch = touches[0];

        if (touchZoom.isZoomed) {
          // Start panning when zoomed
          e.preventDefault();
          panStartRef.current = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            translateX: touchZoom.translateX,
            translateY: touchZoom.translateY,
          };
          return;
        }

        // Single touch when not zoomed - check for double tap
        const now = Date.now();
        const timeSinceLastTap = now - lastTapRef.current;

        if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
          // Double tap detected - reset zoom and pan to initial state
          if (doubleTapTimeoutRef.current) {
            clearTimeout(doubleTapTimeoutRef.current);
          }
          setTouchZoom({
            scale: 1,
            translateX: 0,
            translateY: 0,
            isZoomed: false,
          });
          touchStartRef.current = null;
          panStartRef.current = null;
          e.preventDefault();
          return;
        }

        lastTapRef.current = now;
        // Set timeout to clear double tap detection
        if (doubleTapTimeoutRef.current) {
          clearTimeout(doubleTapTimeoutRef.current);
        }
        doubleTapTimeoutRef.current = setTimeout(() => {
          lastTapRef.current = 0;
        }, 300);
      } else if (touches.length === 2) {
        // Two touches - start pinch gesture
        e.preventDefault();
        const touch1 = touches[0];
        const touch2 = touches[1];
        const distance = getTouchDistance(touch1, touch2);
        const center = getTouchCenter(touch1, touch2);

        // Get current image position relative to container
        if (imageRef.current && imageContainerRef.current) {
          // Ensure base dimensions are set
          if (!baseImageDimensionsRef.current) {
            setBaseDimensions();
          }

          const containerRect =
            imageContainerRef.current.getBoundingClientRect();

          // Calculate pinch center in container coordinates (container center is origin)
          const centerXInContainer =
            center.x - containerRect.left - containerRect.width / 2;
          const centerYInContainer =
            center.y - containerRect.top - containerRect.height / 2;

          // Convert to image coordinates (relative to image center)
          // Account for current translation and scale
          // The image is centered, so we subtract the current translation and divide by scale
          const centerX =
            (centerXInContainer - touchZoom.translateX) / touchZoom.scale;
          const centerY =
            (centerYInContainer - touchZoom.translateY) / touchZoom.scale;

          touchStartRef.current = {
            distance,
            centerX,
            centerY,
            translateX: touchZoom.translateX,
            translateY: touchZoom.translateY,
            scale: touchZoom.scale,
          };
        }
      }
    },
    [supportsHover, touchZoom, imageRef, imageContainerRef, setBaseDimensions],
  );

  // Handle touch move for pinch-to-zoom and panning
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLImageElement>) => {
      // Only handle on mobile (non-hover devices)
      if (supportsHover) return;

      const touches = e.touches;

      if (touches.length === 2 && touchStartRef.current) {
        // Pinch gesture
        e.preventDefault();
        const touch1 = touches[0];
        const touch2 = touches[1];
        const currentDistance = getTouchDistance(touch1, touch2);
        const scaleChange = currentDistance / touchStartRef.current.distance;

        // Calculate new scale (clamped between 1 and 4)
        const newScale = Math.max(
          1,
          Math.min(4, touchStartRef.current.scale * scaleChange),
        );

        // Calculate translation to keep initial pinch center fixed
        // The pinch center point in image coordinates (relative to image center)
        const pinchCenterX = touchStartRef.current.centerX;
        const pinchCenterY = touchStartRef.current.centerY;

        // At the initial scale, the pinch point is at (px * s0, py * s0) in container coords
        // At the new scale, it would be at (px * s1, py * s1) without translation
        // To keep it at (px * s0, py * s0), we need to translate by px * (s0 - s1)
        const scaleDelta = newScale - touchStartRef.current.scale;
        const newTranslateX =
          touchStartRef.current.translateX - pinchCenterX * scaleDelta;
        const newTranslateY =
          touchStartRef.current.translateY - pinchCenterY * scaleDelta;

        // Constrain pan
        const constrained = constrainPan(
          newScale,
          newTranslateX,
          newTranslateY,
        );

        setTouchZoom({
          scale: newScale,
          translateX: constrained.translateX,
          translateY: constrained.translateY,
          isZoomed: newScale > 1,
        });
      } else if (
        touches.length === 1 &&
        touchZoom.isZoomed &&
        panStartRef.current
      ) {
        // Single touch pan when zoomed
        e.preventDefault();
        const touch = touches[0];
        const deltaX = touch.clientX - panStartRef.current.clientX;
        const deltaY = touch.clientY - panStartRef.current.clientY;

        const newTranslateX = panStartRef.current.translateX + deltaX;
        const newTranslateY = panStartRef.current.translateY + deltaY;

        // Constrain pan
        const constrained = constrainPan(
          touchZoom.scale,
          newTranslateX,
          newTranslateY,
        );

        setTouchZoom({
          scale: touchZoom.scale,
          translateX: constrained.translateX,
          translateY: constrained.translateY,
          isZoomed: touchZoom.isZoomed,
        });
      }
    },
    [supportsHover, touchZoom, constrainPan],
  );

  // Handle touch end
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLImageElement>) => {
      // Only handle on mobile (non-hover devices)
      if (supportsHover) return;

      if (e.touches.length < 2) {
        // Reset pinch tracking when less than 2 touches
        touchStartRef.current = null;
      }

      if (e.touches.length === 0) {
        // All touches ended - reset pan tracking
        panStartRef.current = null;

        // If zoomed out completely, reset
        if (touchZoom.scale <= 1) {
          setTouchZoom({
            scale: 1,
            translateX: 0,
            translateY: 0,
            isZoomed: false,
          });
        }
      }
    },
    [supportsHover, touchZoom],
  );

  return {
    touchZoom,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    setBaseDimensions,
  };
}
