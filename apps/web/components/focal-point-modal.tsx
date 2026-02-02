"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getObjectPositionStyle } from "@/lib/image-utils";

interface FocalPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  initialFocalPoint?: { x: number; y: number } | null;
  onSave: (focalPoint: { x: number; y: number }) => void;
  previewAspectRatio?: "circle" | "square";
}

export function FocalPointModal({
  isOpen,
  onClose,
  imageUrl,
  initialFocalPoint,
  onSave,
  previewAspectRatio = "circle",
}: FocalPointModalProps) {
  const t = useTranslations("modals.focalPoint");
  const tCommon = useTranslations("common");
  const [focalPoint, setFocalPoint] = useState<{ x: number; y: number }>(
    initialFocalPoint || { x: 50, y: 50 },
  );
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset focal point when modal opens or initialFocalPoint changes
  useEffect(() => {
    if (isOpen) {
      setFocalPoint(initialFocalPoint || { x: 50, y: 50 });
      setImageLoaded(false);
    }
  }, [isOpen, initialFocalPoint]);

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imageContainerRef.current || !imageRef.current) return;

      const rect = imageContainerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Clamp values between 0 and 100
      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));

      setFocalPoint({ x: clampedX, y: clampedY });
    },
    [],
  );

  const handleSave = () => {
    onSave(focalPoint);
    onClose();
  };

  const handleCancel = () => {
    setFocalPoint(initialFocalPoint || { x: 50, y: 50 });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Main image with click handler */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("clickToSet")}</label>
            <div
              ref={imageContainerRef}
              className="relative aspect-video w-full cursor-crosshair overflow-hidden rounded-lg border bg-muted"
              onClick={handleImageClick}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Set focal point"
                className="h-full w-full object-contain"
                onLoad={() => setImageLoaded(true)}
              />
              {imageLoaded && (
                <>
                  {/* Crosshair indicator */}
                  <div
                    className="pointer-events-none absolute z-10"
                    style={{
                      left: `${focalPoint.x}%`,
                      top: `${focalPoint.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div className="relative">
                      {/* Horizontal line */}
                      <div className="absolute h-0.5 w-16 -translate-x-1/2 bg-white shadow-lg" />
                      {/* Vertical line */}
                      <div className="absolute h-16 w-0.5 -translate-y-1/2 bg-white shadow-lg" />
                      {/* Center circle */}
                      <div className="h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow-lg" />
                    </div>
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("focalPointLabel", {
                x: focalPoint.x.toFixed(1),
                y: focalPoint.y.toFixed(1),
              })}
            </p>
          </div>

          {/* Preview pane */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("preview")}</label>
            <div
              className={`relative overflow-hidden rounded-lg border bg-muted ${
                previewAspectRatio === "circle"
                  ? "aspect-square rounded-full"
                  : "aspect-square"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Preview"
                className="h-full w-full object-cover"
                style={{
                  objectPosition: getObjectPositionStyle(focalPoint),
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("previewDescription")}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={handleSave}>{t("saveFocalPoint")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
