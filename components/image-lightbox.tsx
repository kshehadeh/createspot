"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  VisuallyHidden,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getObjectPositionStyle } from "@/lib/image-utils";

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
  focalPoint?: { x: number; y: number } | null;
}

export function ImageLightbox({
  isOpen,
  onClose,
  imageUrl,
  alt,
  focalPoint,
}: ImageLightboxProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Full screen on mobile, 95vw/vh on desktop */}
      <DialogContent className="!max-w-[100vw] !max-h-[100vh] md:!max-w-[95vw] md:!max-h-[95vh] !w-[100vw] !h-[100vh] md:!w-auto md:!h-auto p-0 bg-black border-0 md:bg-black/90 [&>button]:hidden overflow-hidden !block !rounded-none md:!rounded-lg">
        <VisuallyHidden>
          <DialogTitle>{alt}</DialogTitle>
        </VisuallyHidden>
        <div
          className="relative flex items-center justify-center w-full h-full min-h-0 md:p-4 box-border"
          style={{ maxHeight: "100vh", maxWidth: "100vw" }}
          onClick={onClose}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute right-3 top-3 md:right-2 md:top-2 z-10 h-10 w-10 md:h-9 md:w-9 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
            aria-label="Close"
          >
            <X className="h-6 w-6 md:h-5 md:w-5" />
          </Button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={alt}
            className="h-full w-full object-cover md:max-h-[calc(95vh-2rem)] md:max-w-[calc(95vw-2rem)] md:h-auto md:w-auto md:object-contain select-none"
            style={{
              objectPosition: getObjectPositionStyle(focalPoint),
            }}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
