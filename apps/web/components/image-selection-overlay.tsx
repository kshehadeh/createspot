"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";

interface ImageSelectionOverlayProps {
  imageUrl: string;
  onSelectionComplete: (selection: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
  disabled?: boolean;
}

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DisplayedImageBounds {
  offsetX: number;
  offsetY: number;
  displayedWidth: number;
  displayedHeight: number;
  naturalWidth: number;
  naturalHeight: number;
}

const MIN_SELECTION_SIZE = 20; // Minimum 20px

// Cache for image natural dimensions
const imageDimensionsCache = new Map<
  string,
  { width: number; height: number }
>();

export function ImageSelectionOverlay({
  imageUrl,
  onSelectionComplete,
  disabled = false,
}: ImageSelectionOverlayProps) {
  const t = useTranslations("critique");
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState<SelectionRect | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const cachedNaturalDims = useRef<{ width: number; height: number } | null>(
    null,
  );

  // Preload image and cache natural dimensions
  useEffect(() => {
    const cached = imageDimensionsCache.get(imageUrl);
    if (cached) {
      cachedNaturalDims.current = cached;
      return;
    }

    const img = new Image();
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      imageDimensionsCache.set(imageUrl, dims);
      cachedNaturalDims.current = dims;
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Calculate bounds fresh whenever needed
  const calculateBounds = useCallback((): DisplayedImageBounds | null => {
    if (!containerRef.current || !cachedNaturalDims.current) return null;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    const { width: naturalWidth, height: naturalHeight } =
      cachedNaturalDims.current;

    // Use the standard object-contain formula
    const scale = Math.min(
      containerWidth / naturalWidth,
      containerHeight / naturalHeight,
    );

    const displayedWidth = naturalWidth * scale;
    const displayedHeight = naturalHeight * scale;

    // Center the image
    const offsetX = (containerWidth - displayedWidth) / 2;
    const offsetY = (containerHeight - displayedHeight) / 2;

    return {
      offsetX,
      offsetY,
      displayedWidth,
      displayedHeight,
      naturalWidth,
      naturalHeight,
    };
  }, []);

  const getRelativePosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    [],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      const pos = getRelativePosition(e.clientX, e.clientY);
      setStartPos(pos);
      setIsSelecting(true);
      setSelection(null);
    },
    [disabled, getRelativePosition],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelecting || !startPos || disabled) return;
      e.preventDefault();
      e.stopPropagation();
      const currentPos = getRelativePosition(e.clientX, e.clientY);

      const x = Math.min(startPos.x, currentPos.x);
      const y = Math.min(startPos.y, currentPos.y);
      const width = Math.abs(currentPos.x - startPos.x);
      const height = Math.abs(currentPos.y - startPos.y);

      if (width >= MIN_SELECTION_SIZE && height >= MIN_SELECTION_SIZE) {
        setSelection({ x, y, width, height });
      }
    },
    [isSelecting, startPos, disabled, getRelativePosition],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelecting || disabled) return;
      e.preventDefault();
      e.stopPropagation();
      setIsSelecting(false);

      // Calculate fresh bounds at the moment of selection
      const bounds = calculateBounds();

      if (selection && startPos && bounds) {
        // Convert container pixel coordinates to actual image percentages
        // Position relative to displayed image origin
        const relX = selection.x - bounds.offsetX;
        const relY = selection.y - bounds.offsetY;

        // Convert to percentages of displayed image dimensions
        // (which equals percentages of natural image due to uniform scaling)
        const percentSelection = {
          x: (relX / bounds.displayedWidth) * 100,
          y: (relY / bounds.displayedHeight) * 100,
          width: (selection.width / bounds.displayedWidth) * 100,
          height: (selection.height / bounds.displayedHeight) * 100,
        };

        onSelectionComplete(percentSelection);
      }

      setStartPos(null);
      setSelection(null);
    },
    [
      isSelecting,
      selection,
      startPos,
      calculateBounds,
      disabled,
      onSelectionComplete,
    ],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      const pos = getRelativePosition(touch.clientX, touch.clientY);
      setStartPos(pos);
      setIsSelecting(true);
      setSelection(null);
    },
    [disabled, getRelativePosition],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isSelecting || !startPos || disabled) return;
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      const currentPos = getRelativePosition(touch.clientX, touch.clientY);

      const x = Math.min(startPos.x, currentPos.x);
      const y = Math.min(startPos.y, currentPos.y);
      const width = Math.abs(currentPos.x - startPos.x);
      const height = Math.abs(currentPos.y - startPos.y);

      if (width >= MIN_SELECTION_SIZE && height >= MIN_SELECTION_SIZE) {
        setSelection({ x, y, width, height });
      }
    },
    [isSelecting, startPos, disabled, getRelativePosition],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isSelecting || disabled) return;
      e.preventDefault();
      e.stopPropagation();
      setIsSelecting(false);

      // Calculate fresh bounds at the moment of selection
      const bounds = calculateBounds();

      if (selection && startPos && bounds) {
        // Convert container pixel coordinates to actual image percentages
        const relX = selection.x - bounds.offsetX;
        const relY = selection.y - bounds.offsetY;

        const percentSelection = {
          x: (relX / bounds.displayedWidth) * 100,
          y: (relY / bounds.displayedHeight) * 100,
          width: (selection.width / bounds.displayedWidth) * 100,
          height: (selection.height / bounds.displayedHeight) * 100,
        };

        onSelectionComplete(percentSelection);
      }

      setStartPos(null);
      setSelection(null);
    },
    [
      isSelecting,
      selection,
      startPos,
      calculateBounds,
      disabled,
      onSelectionComplete,
    ],
  );

  const handleCancel = useCallback(() => {
    setIsSelecting(false);
    setStartPos(null);
    setSelection(null);
  }, []);

  if (disabled) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleCancel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {selection && (
        <>
          {/* Selection rectangle */}
          <div
            className="absolute border-2 border-primary bg-primary/10 pointer-events-none z-10"
            style={{
              left: `${selection.x}px`,
              top: `${selection.y}px`,
              width: `${selection.width}px`,
              height: `${selection.height}px`,
            }}
          />
          {/* Instructions */}
          <div
            className="absolute bg-background/90 backdrop-blur-sm border border-border rounded-md p-2 text-sm text-foreground pointer-events-none z-20"
            style={{
              left: `${selection.x + selection.width / 2 - 100}px`,
              top: `${selection.y - 40}px`,
            }}
          >
            {t("selectImageArea")}
          </div>
        </>
      )}
    </div>
  );
}
