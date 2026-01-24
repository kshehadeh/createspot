"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

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
import { ResizableCrop } from "./resizable-crop";
import {
  RotateCw,
  RotateCcw,
  Grid3x3,
  Save,
  RefreshCw,
  Sparkles,
  Info,
  Crop,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  canvasToFile,
  getMimeTypeFromSource,
  getImageMetadata,
  loadImageToCanvas,
  cropImage,
  rotateImage,
  type ImageMetadata,
  type CropArea,
} from "@/lib/image-editor";
import {
  autoEvenLighting as applyAutoEvenLighting,
  removeYellowing as applyRemoveYellowing,
  evenColors as applyEvenColors,
} from "@/lib/image-editor/lighting";

interface ImageEditorProps {
  submissionId: string;
  imageUrl: string;
  submissionTitle: string | null;
}

export function ImageEditor({
  submissionId,
  imageUrl: initialImageUrl,
}: ImageEditorProps) {
  const t = useTranslations("imageEditor");
  const tCommon = useTranslations("common");

  const [imageUrl, setImageUrl] = useState<string>(initialImageUrl);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [imageMetadata, setImageMetadata] = useState<ImageMetadata | null>(
    null,
  );
  const [rotation, setRotation] = useState(0);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [pendingCropArea, setPendingCropArea] = useState<CropArea | null>(null);
  const [isCropMode, setIsCropMode] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [autoEvenLighting, setAutoEvenLighting] = useState(false);
  const [removeYellowing, setRemoveYellowing] = useState(false);
  const [evenColors, setEvenColors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isImageInfoOpen, setIsImageInfoOpen] = useState(false);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track if there are any changes
  const hasChanges =
    cropArea ||
    rotation !== 0 ||
    autoEvenLighting ||
    removeYellowing ||
    evenColors;

  // Load image metadata on mount
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const metadata = await getImageMetadata(imageUrl);
        setImageMetadata(metadata);
      } catch (error) {
        console.error("Error loading image metadata:", error);
      }
    };
    loadMetadata();
  }, [imageUrl]);

  // Generate preview with all adjustments (crop, rotation, lighting)
  useEffect(() => {
    if (!imageUrl) {
      setPreviewImageUrl(null);
      return;
    }

    // Clear existing timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    // Debounce preview generation
    previewTimeoutRef.current = setTimeout(async () => {
      try {
        // Load image to canvas
        let canvas = await loadImageToCanvas(imageUrl);

        // Apply crop first (if any)
        if (cropArea && cropArea.width > 0 && cropArea.height > 0) {
          canvas = cropImage(canvas, cropArea);
        }

        // Apply rotation (if any)
        if (rotation !== 0) {
          canvas = rotateImage(canvas, rotation);
        }

        // Apply lighting adjustments if any are enabled
        const hasLightingAdjustments =
          autoEvenLighting || removeYellowing || evenColors;
        if (hasLightingAdjustments) {
          // Apply auto even lighting first if enabled
          if (autoEvenLighting) {
            canvas = applyAutoEvenLighting(canvas);
          }

          // Apply color corrections
          if (removeYellowing) {
            canvas = applyRemoveYellowing(canvas, 80);
          }

          if (evenColors) {
            canvas = applyEvenColors(canvas, 60);
          }
        }

        // If no adjustments at all, use original
        const hasAnyAdjustments =
          cropArea || rotation !== 0 || hasLightingAdjustments;
        if (!hasAnyAdjustments) {
          setPreviewImageUrl(null);
          return;
        }

        // Convert to data URL
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setPreviewImageUrl(dataUrl);
      } catch (error) {
        console.error("Error generating preview:", error);
        setPreviewImageUrl(null);
      }
    }, 150);

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [
    imageUrl,
    cropArea,
    rotation,
    autoEvenLighting,
    removeYellowing,
    evenColors,
  ]);

  const handleCropChange = useCallback((newCropArea: CropArea) => {
    // Store as pending crop (not applied yet)
    setPendingCropArea(newCropArea);
  }, []);

  const handleApplyCrop = useCallback(() => {
    // Apply the pending crop area
    if (pendingCropArea) {
      setCropArea(pendingCropArea);
      setIsCropMode(false);
      toast.success(t("cropApplied"));
    }
  }, [pendingCropArea, t]);

  const handleCancelCrop = useCallback(() => {
    // Cancel crop - restore previous crop area or clear pending
    setPendingCropArea(cropArea);
    setIsCropMode(false);
  }, [cropArea]);

  const handleRotate = (clockwise: boolean) => {
    setRotation((prev) => (clockwise ? prev + 90 : prev - 90));
  };

  const handleReset = () => {
    setRotation(0);
    setCropArea(null);
    setPendingCropArea(null);
    setIsCropMode(false);
    setAutoEvenLighting(false);
    setRemoveYellowing(false);
    setEvenColors(false);
    setPreviewImageUrl(null);
  };

  const handleSave = async () => {
    if (!imageUrl) return;

    setSaving(true);
    try {
      // Load original image
      let canvas = await loadImageToCanvas(imageUrl);

      // Apply crop first (if any)
      if (cropArea && cropArea.width > 0 && cropArea.height > 0) {
        canvas = cropImage(canvas, cropArea);
      }

      // Apply rotation (if any)
      if (rotation !== 0) {
        canvas = rotateImage(canvas, rotation);
      }

      // Apply lighting adjustments
      if (autoEvenLighting) {
        canvas = applyAutoEvenLighting(canvas);
      }

      if (removeYellowing) {
        canvas = applyRemoveYellowing(canvas, 80);
      }

      if (evenColors) {
        canvas = applyEvenColors(canvas, 60);
      }

      // Get MIME type from original image
      const mimeType = getMimeTypeFromSource(imageUrl) || "image/jpeg";
      const filename = imageUrl.split("/").pop() || "image.jpg";

      // Convert canvas to file
      const file = await canvasToFile(canvas, filename, 0.9, mimeType);

      // Upload to server
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`/api/submissions/${submissionId}/image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Failed to save image" }));
        throw new Error(error.error || "Failed to save image");
      }

      const data = await response.json();

      // Update image URL with the new one
      setImageUrl(data.imageUrl);
      setPreviewImageUrl(null);

      // Reset adjustments
      setRotation(0);
      setCropArea(null);
      setPendingCropArea(null);
      setAutoEvenLighting(false);
      setRemoveYellowing(false);
      setEvenColors(false);

      toast.success(t("saved"));
    } catch (error) {
      console.error("Error saving image:", error);
      toast.error(
        error instanceof Error ? error.message : t("errors.saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {imageUrl && (
        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Main editor area */}
          <div className="lg:col-span-2">
            <div
              className="relative h-[400px] w-full overflow-hidden sm:h-[500px]"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%),
                  linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%),
                  linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)
                `,
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
              }}
            >
              {showGrid && (
                <div
                  className="absolute inset-0 z-10 pointer-events-none"
                  style={{
                    backgroundImage: `
                          linear-gradient(to right, hsl(var(--primary) / 0.2) 1px, transparent 1px),
                          linear-gradient(to bottom, hsl(var(--primary) / 0.2) 1px, transparent 1px)
                        `,
                    backgroundSize: "32px 32px",
                  }}
                />
              )}
              {isCropMode ? (
                <>
                  <ResizableCrop
                    imageUrl={previewImageUrl || imageUrl}
                    rotation={rotation}
                    onCropChange={handleCropChange}
                    initialCrop={pendingCropArea || cropArea}
                  />
                  {/* Crop action buttons */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelCrop}
                    >
                      <X className="h-4 w-4 mr-2" />
                      {tCommon("cancel")}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleApplyCrop}
                      disabled={!pendingCropArea}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {t("applyCrop")}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="relative h-full w-full overflow-hidden flex items-center justify-center bg-black/5">
                  <img
                    src={(() => {
                      const url = previewImageUrl || imageUrl;
                      if (!url) return undefined;
                      // Preview images are data URLs (same origin), so no proxy needed
                      if (previewImageUrl) return url;
                      // For regular image URLs, proxy if cross-origin
                      return typeof window !== "undefined" && isCrossOrigin(url)
                        ? `/api/image-proxy?url=${encodeURIComponent(url)}`
                        : url;
                    })()}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                    style={
                      previewImageUrl
                        ? undefined // Preview already has all transformations applied
                        : {
                            transform: `rotate(${rotation}deg)`,
                            transformOrigin: "center center",
                          }
                    }
                    crossOrigin={
                      previewImageUrl
                        ? undefined
                        : typeof window !== "undefined" &&
                            imageUrl &&
                            isCrossOrigin(imageUrl)
                          ? undefined
                          : "anonymous"
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Controls sidebar */}
          <div className="space-y-4">
            {/* Image information - collapsible */}
            {imageMetadata && (
              <div>
                <button
                  onClick={() => setIsImageInfoOpen(!isImageInfoOpen)}
                  className="flex items-center justify-between w-full text-2xl font-semibold mb-4 hover:opacity-80 transition-opacity"
                >
                  <span className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    {t("imageInfo")}
                  </span>
                  {isImageInfoOpen ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
                {isImageInfoOpen && (
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("dimensions")}:
                      </span>
                      <span className="font-mono">
                        {imageMetadata.width} × {imageMetadata.height}
                      </span>
                    </div>
                    {imageMetadata.format && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t("format")}:
                        </span>
                        <span className="font-mono uppercase">
                          {imageMetadata.format}
                        </span>
                      </div>
                    )}
                    {imageMetadata.size && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t("size")}:
                        </span>
                        <span className="font-mono">
                          {(imageMetadata.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    )}
                    {imageMetadata.colorDepth && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t("colorDepth")}:
                        </span>
                        <span className="font-mono">
                          {imageMetadata.colorDepth} bit
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* All tools in one container */}
            <div>
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Wrench className="h-6 w-6" />
                {t("tools")}
              </h3>
              <div className="space-y-3">
                <Button
                  variant={isCropMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (isCropMode) {
                      // Exit crop mode - cancel any pending changes
                      handleCancelCrop();
                    } else {
                      // Enter crop mode - initialize pending crop with current crop area
                      setPendingCropArea(cropArea);
                      setIsCropMode(true);
                    }
                  }}
                  className="w-full justify-start"
                >
                  <Crop className="h-4 w-4 mr-2" />
                  {isCropMode ? t("exitCrop") : t("crop")}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRotate(false)}
                    className="flex-1"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {t("rotateLeft")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRotate(true)}
                    className="flex-1"
                  >
                    <RotateCw className="h-4 w-4 mr-2" />
                    {t("rotateRight")}
                  </Button>
                </div>
                <Button
                  variant={autoEvenLighting ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoEvenLighting(!autoEvenLighting)}
                  className="w-full justify-start"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t("removeUnwantedShadows")}
                </Button>
                <Button
                  variant={removeYellowing ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRemoveYellowing(!removeYellowing)}
                  className="w-full justify-start"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t("removeYellowing")}
                </Button>
                <Button
                  variant={evenColors ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEvenColors(!evenColors)}
                  className="w-full justify-start"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t("evenColors")}
                </Button>

                {/* Separator */}
                <div className="border-t border-border my-2" />

                <Button
                  variant={showGrid ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowGrid(!showGrid)}
                  className="w-full justify-start"
                >
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  {showGrid ? t("hideGrid") : t("showGrid")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={!hasChanges}
                  className="w-full justify-start"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t("reset")}
                </Button>
              </div>
            </div>

            {/* Save button */}
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="w-full"
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
