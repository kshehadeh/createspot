"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";

/**
 * Check if a URL is from a different origin
 */
function isCrossOrigin(url: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const urlObj = new URL(url, window.location.href);
    return urlObj.origin !== window.location.origin;
  } catch {
    return false;
  }
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ResizableCropProps {
  imageUrl: string;
  rotation?: number;
  onCropChange: (cropArea: CropArea) => void;
  initialCrop?: CropArea | null;
}

type HandlePosition = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export function ResizableCrop({
  imageUrl,
  rotation = 0,
  onCropChange,
  initialCrop,
}: ResizableCropProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const onCropChangeRef = useRef(onCropChange);
  const initialCropRef = useRef(initialCrop);
  const hasInitializedRef = useRef(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<"move" | HandlePosition | null>(
    null,
  );
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // Keep ref in sync with callback
  useLayoutEffect(() => {
    onCropChangeRef.current = onCropChange;
  }, [onCropChange]);

  // Calculate scale factor between display and actual image
  const scale = imageSize.width > 0 ? displaySize.width / imageSize.width : 1;

  // Initialize crop area when image loads (only once)
  useEffect(() => {
    if (
      imageLoaded &&
      displaySize.width > 0 &&
      displaySize.height > 0 &&
      !hasInitializedRef.current
    ) {
      hasInitializedRef.current = true;
      const initial = initialCropRef.current;
      if (initial && initial.width > 0 && initial.height > 0) {
        setCrop({
          x: initial.x * scale,
          y: initial.y * scale,
          width: initial.width * scale,
          height: initial.height * scale,
        });
      } else {
        // Default to 80% of image centered
        const margin = 0.1;
        setCrop({
          x: displaySize.width * margin,
          y: displaySize.height * margin,
          width: displaySize.width * (1 - margin * 2),
          height: displaySize.height * (1 - margin * 2),
        });
      }
    }
  }, [imageLoaded, displaySize, scale]);

  // Report crop changes in image pixel coordinates
  useEffect(() => {
    if (imageLoaded && scale > 0) {
      onCropChangeRef.current({
        x: Math.round(crop.x / scale),
        y: Math.round(crop.y / scale),
        width: Math.round(crop.width / scale),
        height: Math.round(crop.height / scale),
      });
    }
  }, [crop, scale, imageLoaded]);

  const handleImageLoad = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const container = containerRef.current;

      // Get natural image size
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      setImageSize({ width: naturalWidth, height: naturalHeight });

      // Calculate display size maintaining aspect ratio
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      const imageAspect = naturalWidth / naturalHeight;
      const containerAspect = containerWidth / containerHeight;

      let displayWidth: number;
      let displayHeight: number;

      if (imageAspect > containerAspect) {
        displayWidth = containerWidth;
        displayHeight = containerWidth / imageAspect;
      } else {
        displayHeight = containerHeight;
        displayWidth = containerHeight * imageAspect;
      }

      setDisplaySize({ width: displayWidth, height: displayHeight });
      setImageLoaded(true);
    }
  }, []);

  const getEventPosition = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current || !imageRef.current) return { x: 0, y: 0 };

    const imgRect = imageRef.current.getBoundingClientRect();

    // Get position relative to the image
    return {
      x: e.clientX - imgRect.left,
      y: e.clientY - imgRect.top,
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: "move" | HandlePosition) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setDragType(type);
      setDragStart(getEventPosition(e));
      setCropStart({ ...crop });
    },
    [crop, getEventPosition],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragType) return;

      const pos = getEventPosition(e);
      const deltaX = pos.x - dragStart.x;
      const deltaY = pos.y - dragStart.y;

      const minSize = 20;

      setCrop((prev) => {
        let newCrop = { ...cropStart };

        if (dragType === "move") {
          newCrop.x = Math.max(
            0,
            Math.min(cropStart.x + deltaX, displaySize.width - prev.width),
          );
          newCrop.y = Math.max(
            0,
            Math.min(cropStart.y + deltaY, displaySize.height - prev.height),
          );
        } else {
          // Handle resize
          switch (dragType) {
            case "nw":
              newCrop.x = Math.max(
                0,
                Math.min(
                  cropStart.x + deltaX,
                  cropStart.x + cropStart.width - minSize,
                ),
              );
              newCrop.y = Math.max(
                0,
                Math.min(
                  cropStart.y + deltaY,
                  cropStart.y + cropStart.height - minSize,
                ),
              );
              newCrop.width = cropStart.width - (newCrop.x - cropStart.x);
              newCrop.height = cropStart.height - (newCrop.y - cropStart.y);
              break;
            case "n":
              newCrop.y = Math.max(
                0,
                Math.min(
                  cropStart.y + deltaY,
                  cropStart.y + cropStart.height - minSize,
                ),
              );
              newCrop.height = cropStart.height - (newCrop.y - cropStart.y);
              break;
            case "ne":
              newCrop.y = Math.max(
                0,
                Math.min(
                  cropStart.y + deltaY,
                  cropStart.y + cropStart.height - minSize,
                ),
              );
              newCrop.width = Math.max(
                minSize,
                Math.min(
                  cropStart.width + deltaX,
                  displaySize.width - cropStart.x,
                ),
              );
              newCrop.height = cropStart.height - (newCrop.y - cropStart.y);
              break;
            case "e":
              newCrop.width = Math.max(
                minSize,
                Math.min(
                  cropStart.width + deltaX,
                  displaySize.width - cropStart.x,
                ),
              );
              break;
            case "se":
              newCrop.width = Math.max(
                minSize,
                Math.min(
                  cropStart.width + deltaX,
                  displaySize.width - cropStart.x,
                ),
              );
              newCrop.height = Math.max(
                minSize,
                Math.min(
                  cropStart.height + deltaY,
                  displaySize.height - cropStart.y,
                ),
              );
              break;
            case "s":
              newCrop.height = Math.max(
                minSize,
                Math.min(
                  cropStart.height + deltaY,
                  displaySize.height - cropStart.y,
                ),
              );
              break;
            case "sw":
              newCrop.x = Math.max(
                0,
                Math.min(
                  cropStart.x + deltaX,
                  cropStart.x + cropStart.width - minSize,
                ),
              );
              newCrop.width = cropStart.width - (newCrop.x - cropStart.x);
              newCrop.height = Math.max(
                minSize,
                Math.min(
                  cropStart.height + deltaY,
                  displaySize.height - cropStart.y,
                ),
              );
              break;
            case "w":
              newCrop.x = Math.max(
                0,
                Math.min(
                  cropStart.x + deltaX,
                  cropStart.x + cropStart.width - minSize,
                ),
              );
              newCrop.width = cropStart.width - (newCrop.x - cropStart.x);
              break;
          }
        }

        return newCrop;
      });
    },
    [isDragging, dragType, dragStart, cropStart, displaySize, getEventPosition],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleStyle: React.CSSProperties = {
    position: "absolute",
    width: 12,
    height: 12,
    backgroundColor: "white",
    border: "2px solid #3b82f6",
    borderRadius: 2,
    zIndex: 20,
  };

  const edgeHandleStyle: React.CSSProperties = {
    position: "absolute",
    backgroundColor: "transparent",
    zIndex: 20,
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full flex items-center justify-center bg-black/10 overflow-hidden select-none"
    >
      <img
        ref={imageRef}
        src={
          typeof window !== "undefined" && isCrossOrigin(imageUrl)
            ? `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`
            : imageUrl
        }
        alt="Crop preview"
        onLoad={handleImageLoad}
        className="max-w-full max-h-full object-contain"
        style={{
          transform: `rotate(${rotation}deg)`,
          width: displaySize.width || "auto",
          height: displaySize.height || "auto",
        }}
        draggable={false}
        crossOrigin={
          typeof window !== "undefined" && isCrossOrigin(imageUrl)
            ? undefined
            : "anonymous"
        }
      />

      {imageLoaded && (
        <>
          {/* Dark overlay outside crop area */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: "50%",
              top: "50%",
              width: displaySize.width,
              height: displaySize.height,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Top overlay */}
            <div
              className="absolute bg-black/50"
              style={{
                left: 0,
                top: 0,
                width: displaySize.width,
                height: crop.y,
              }}
            />
            {/* Bottom overlay */}
            <div
              className="absolute bg-black/50"
              style={{
                left: 0,
                top: crop.y + crop.height,
                width: displaySize.width,
                height: displaySize.height - crop.y - crop.height,
              }}
            />
            {/* Left overlay */}
            <div
              className="absolute bg-black/50"
              style={{
                left: 0,
                top: crop.y,
                width: crop.x,
                height: crop.height,
              }}
            />
            {/* Right overlay */}
            <div
              className="absolute bg-black/50"
              style={{
                left: crop.x + crop.width,
                top: crop.y,
                width: displaySize.width - crop.x - crop.width,
                height: crop.height,
              }}
            />
          </div>

          {/* Crop area container */}
          <div
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              width: displaySize.width,
              height: displaySize.height,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Crop box */}
            <div
              className="absolute border-2 border-white cursor-move"
              style={{
                left: crop.x,
                top: crop.y,
                width: crop.width,
                height: crop.height,
                boxShadow: "0 0 0 9999px transparent",
              }}
              onMouseDown={(e) => handleMouseDown(e, "move")}
            >
              {/* Grid lines */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/40" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/40" />
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white/40" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white/40" />
              </div>

              {/* Corner handles */}
              <div
                style={{
                  ...handleStyle,
                  left: -6,
                  top: -6,
                  cursor: "nw-resize",
                }}
                onMouseDown={(e) => handleMouseDown(e, "nw")}
              />
              <div
                style={{
                  ...handleStyle,
                  right: -6,
                  top: -6,
                  cursor: "ne-resize",
                }}
                onMouseDown={(e) => handleMouseDown(e, "ne")}
              />
              <div
                style={{
                  ...handleStyle,
                  left: -6,
                  bottom: -6,
                  cursor: "sw-resize",
                }}
                onMouseDown={(e) => handleMouseDown(e, "sw")}
              />
              <div
                style={{
                  ...handleStyle,
                  right: -6,
                  bottom: -6,
                  cursor: "se-resize",
                }}
                onMouseDown={(e) => handleMouseDown(e, "se")}
              />

              {/* Edge handles */}
              <div
                style={{
                  ...edgeHandleStyle,
                  left: "50%",
                  top: -4,
                  transform: "translateX(-50%)",
                  width: 24,
                  height: 8,
                  cursor: "n-resize",
                }}
                onMouseDown={(e) => handleMouseDown(e, "n")}
              >
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-1 bg-white rounded" />
              </div>
              <div
                style={{
                  ...edgeHandleStyle,
                  left: "50%",
                  bottom: -4,
                  transform: "translateX(-50%)",
                  width: 24,
                  height: 8,
                  cursor: "s-resize",
                }}
                onMouseDown={(e) => handleMouseDown(e, "s")}
              >
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-1 bg-white rounded" />
              </div>
              <div
                style={{
                  ...edgeHandleStyle,
                  top: "50%",
                  left: -4,
                  transform: "translateY(-50%)",
                  width: 8,
                  height: 24,
                  cursor: "w-resize",
                }}
                onMouseDown={(e) => handleMouseDown(e, "w")}
              >
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded" />
              </div>
              <div
                style={{
                  ...edgeHandleStyle,
                  top: "50%",
                  right: -4,
                  transform: "translateY(-50%)",
                  width: 8,
                  height: 24,
                  cursor: "e-resize",
                }}
                onMouseDown={(e) => handleMouseDown(e, "e")}
              >
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
