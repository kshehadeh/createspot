"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ResizableCrop } from "@/components/resizable-crop";
import {
  RotateCw,
  RotateCcw,
  Grid3x3,
  Save,
  RefreshCw,
  Sparkles,
  Crop,
  Check,
  X,
} from "lucide-react";
import { Button } from "@createspot/ui-primitives/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { cn } from "@/lib/utils";

function AutoFixStatusToastRow({
  message,
  variant,
}: {
  message: ReactNode;
  variant: "loading" | "done";
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="relative flex size-9 shrink-0 items-center justify-center"
        aria-hidden
      >
        {variant === "loading" ? (
          <>
            <span
              className="absolute size-7 rounded-full border-2 border-primary/20 border-t-primary animate-spin"
              style={{ animationDuration: "0.85s" }}
            />
            <Sparkles className="relative z-10 size-3.5 text-primary animate-pulse" />
          </>
        ) : (
          <>
            <span className="absolute size-7 rounded-full border-2 border-primary/40" />
            <Check
              className="relative z-10 size-3.5 text-primary"
              strokeWidth={2.5}
            />
          </>
        )}
      </span>
      <span className="min-w-0 flex-1 text-left leading-snug">{message}</span>
    </div>
  );
}

interface ImageEditorProps {
  submissionId: string;
  imageUrl: string;
  submissionTitle: string | null;
  onImageSaved?: (imageUrl: string) => void;
  /** Fires when unsaved edits exist (crop, rotation, session preview, etc.) */
  onDirtyChange?: (dirty: boolean) => void;
}

export function ImageEditor({
  submissionId,
  imageUrl: initialImageUrl,
  submissionTitle,
  onImageSaved,
  onDirtyChange,
}: ImageEditorProps) {
  const t = useTranslations("imageEditor");
  const tCommon = useTranslations("common");

  const [imageUrl, setImageUrl] = useState<string>(initialImageUrl);
  const [sessionImageUrl, setSessionImageUrl] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [imageMetadata, setImageMetadata] = useState<ImageMetadata | null>(
    null,
  );
  const [rotation, setRotation] = useState(0);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [pendingCropArea, setPendingCropArea] = useState<CropArea | null>(null);
  const [isCropMode, setIsCropMode] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [saving, setSaving] = useState(false);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [toolsTooltipSide, setToolsTooltipSide] = useState<"left" | "top">(
    "top",
  );
  const sourceImageUrl = sessionImageUrl ?? imageUrl;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setToolsTooltipSide(mq.matches ? "left" : "top");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const metadataSubtitle = imageMetadata
    ? [
        `${imageMetadata.width} × ${imageMetadata.height}`,
        imageMetadata.format?.toUpperCase(),
        imageMetadata.size
          ? `${(imageMetadata.size / 1024).toFixed(1)} KB`
          : undefined,
        imageMetadata.colorDepth
          ? `${imageMetadata.colorDepth} bit`
          : undefined,
      ]
        .filter(Boolean)
        .join(" • ")
    : t("loadingImage");

  // Track if there are any changes
  const hasChanges = Boolean(cropArea || rotation !== 0 || sessionImageUrl);

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  // Load image metadata on mount
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const metadata = await getImageMetadata(sourceImageUrl);
        setImageMetadata(metadata);
      } catch (error) {
        console.error("Error loading image metadata:", error);
      }
    };
    loadMetadata();
  }, [sourceImageUrl]);

  // Generate preview with crop and rotation adjustments
  useEffect(() => {
    if (!sourceImageUrl) {
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
        let canvas = await loadImageToCanvas(sourceImageUrl);

        // Apply crop first (if any)
        if (cropArea && cropArea.width > 0 && cropArea.height > 0) {
          canvas = cropImage(canvas, cropArea);
        }

        // Apply rotation (if any)
        if (rotation !== 0) {
          canvas = rotateImage(canvas, rotation);
        }

        // If no adjustments at all, use original
        const hasAnyAdjustments = cropArea || rotation !== 0;
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
  }, [sourceImageUrl, cropArea, rotation]);

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
    setSessionImageUrl(null);
    setPreviewImageUrl(null);
  };

  const handleSave = useCallback(async () => {
    if (!sourceImageUrl) return;

    setSaving(true);
    try {
      // Load original image
      let canvas = await loadImageToCanvas(sourceImageUrl);

      // Apply crop first (if any)
      if (cropArea && cropArea.width > 0 && cropArea.height > 0) {
        canvas = cropImage(canvas, cropArea);
      }

      // Apply rotation (if any)
      if (rotation !== 0) {
        canvas = rotateImage(canvas, rotation);
      }

      // Get MIME type from original image
      const mimeType = getMimeTypeFromSource(sourceImageUrl) || "image/jpeg";
      const filename = sourceImageUrl.split("/").pop() || "image.jpg";

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

      // Update image URL - new key is always generated on save, so no cache-busting needed
      setImageUrl(data.imageUrl);
      setSessionImageUrl(null);
      setPreviewImageUrl(null);

      // Reset adjustments before notifying parent so dirty state clears before close
      setRotation(0);
      setCropArea(null);
      setPendingCropArea(null);

      onImageSaved?.(data.imageUrl);

      toast.success(t("saved"));
    } catch (error) {
      console.error("Error saving image:", error);
      toast.error(
        error instanceof Error ? error.message : t("errors.saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }, [cropArea, onImageSaved, rotation, sourceImageUrl, submissionId, t]);

  const handleAutoFix = useCallback(async () => {
    if (!sourceImageUrl) return;

    setIsAutoFixing(true);
    const toastId = crypto.randomUUID();
    const loadingToastOptions = {
      id: toastId,
      icon: null,
    } as const;
    toast.loading(
      <AutoFixStatusToastRow
        message={t("autoFixToastWorking")}
        variant="loading"
      />,
      loadingToastOptions,
    );
    const stillWorkingTimer = setTimeout(() => {
      toast.loading(
        <AutoFixStatusToastRow
          message={t("autoFixToastStillWorking")}
          variant="loading"
        />,
        loadingToastOptions,
      );
    }, 10_000);

    try {
      const response = await fetch(
        `/api/submissions/${submissionId}/image/auto-fix`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sourceImageUrl }),
        },
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: t("autoFixFailed") }));
        throw new Error(error.error || t("autoFixFailed"));
      }

      const data = await response.json();
      if (!data?.imageDataUrl) {
        throw new Error(t("autoFixFailed"));
      }

      setSessionImageUrl(data.imageDataUrl);
      setPreviewImageUrl(null);
      toast.success(
        <AutoFixStatusToastRow message={t("autoFixApplied")} variant="done" />,
        { id: toastId, icon: null, description: undefined },
      );
    } catch (error) {
      console.error("Auto-fix failed:", error);
      toast.error(error instanceof Error ? error.message : t("autoFixFailed"), {
        id: toastId,
        icon: null,
        description: undefined,
      });
    } finally {
      clearTimeout(stillWorkingTimer);
      setIsAutoFixing(false);
    }
  }, [sourceImageUrl, submissionId, t]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold sm:text-3xl">
            {submissionTitle || t("untitled")}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            {metadataSubtitle}
          </p>
        </div>
      </div>
      {imageUrl && (
        <div className="grid h-full min-h-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          {/* Main editor area */}
          <div className="min-h-0">
            <div
              className="relative h-[55vh] min-h-[420px] w-full overflow-hidden rounded-lg border border-border/40 sm:h-[65vh]"
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
                    imageUrl={previewImageUrl || sourceImageUrl}
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
                    src={previewImageUrl || sourceImageUrl || undefined}
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
                  />
                </div>
              )}
            </div>
          </div>

          {/* Compact tools rail */}
          <TooltipProvider>
            <div className="flex shrink-0 flex-row gap-2 rounded-lg border border-border/40 bg-background/95 p-2 lg:h-fit lg:flex-col">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isCropMode ? "default" : "outline"}
                    size="icon"
                    onClick={() => {
                      if (isCropMode) {
                        handleCancelCrop();
                      } else {
                        setPendingCropArea(cropArea);
                        setIsCropMode(true);
                      }
                    }}
                    aria-label={isCropMode ? t("exitCrop") : t("crop")}
                  >
                    <Crop className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={toolsTooltipSide}>
                  {isCropMode ? t("exitCrop") : t("crop")}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRotate(false)}
                    aria-label={t("rotateLeft")}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={toolsTooltipSide}>
                  {t("rotateLeft")}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRotate(true)}
                    aria-label={t("rotateRight")}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={toolsTooltipSide}>
                  {t("rotateRight")}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="icon"
                    className={cn(
                      "begin-button border-0 text-white [&_svg]:text-white",
                      isAutoFixing && "clicked",
                    )}
                    onClick={handleAutoFix}
                    disabled={isAutoFixing || saving}
                    aria-label={isAutoFixing ? t("autoFixing") : t("autoFix")}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={toolsTooltipSide}>
                  {isAutoFixing ? t("autoFixing") : t("autoFix")}
                </TooltipContent>
              </Tooltip>

              <div
                aria-hidden
                className="shrink-0 self-center bg-border max-lg:h-6 max-lg:w-px lg:h-px lg:w-full"
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showGrid ? "default" : "outline"}
                    size="icon"
                    onClick={() => setShowGrid(!showGrid)}
                    aria-label={showGrid ? t("hideGrid") : t("showGrid")}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={toolsTooltipSide}>
                  {showGrid ? t("hideGrid") : t("showGrid")}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleReset}
                    disabled={!hasChanges}
                    aria-label={t("reset")}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={toolsTooltipSide}>
                  {t("reset")}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    size="icon"
                    aria-label={saving ? t("saving") : t("save")}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={toolsTooltipSide}>
                  {saving ? t("saving") : t("save")}
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
