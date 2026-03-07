"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { FileText, MessageSquareText } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ProgressionLightbox,
  ProgressionItem,
} from "@/components/progression-lightbox";

interface ProgressionStripProps {
  progressions: ProgressionItem[];
  submissionTitle?: string | null;
  /** Whether to enable download protection on the lightbox. Default: true */
  protectionEnabled?: boolean;
}

export function ProgressionStrip({
  progressions,
  submissionTitle,
  protectionEnabled = true,
}: ProgressionStripProps) {
  const t = useTranslations("progression");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (progressions.length === 0) {
    return null;
  }

  const handleThumbnailClick = (index: number) => {
    setLightboxIndex(index);
  };

  const handleLightboxClose = () => {
    setLightboxIndex(null);
  };

  return (
    <>
      <div className="w-full">
        {/* Section header */}
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {t("title")}
        </h3>

        {/* Flex row: progression order left to right, fills available space, max 4 per row */}
        <div className="flex flex-row flex-wrap gap-4 w-full">
          <TooltipProvider delayDuration={300}>
            {progressions.map((progression, index) => (
              <div
                key={progression.id}
                className="min-w-[140px] flex-1 basis-1/4 min-h-0"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleThumbnailClick(index)}
                      className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary/50 focus:border-primary focus:outline-none transition-all group bg-muted"
                      aria-label={t("viewProgression")}
                    >
                      {progression.imageUrl ? (
                        <Image
                          src={progression.imageUrl}
                          alt={`${t("progressionStep", { step: index + 1 })}`}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        // Text-only progression
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                        </div>
                      )}

                      {/* Text indicator for image+text progressions */}
                      {progression.imageUrl && progression.text && (
                        <div className="absolute bottom-1 right-1 p-1 rounded bg-black/60">
                          <FileText className="h-3 w-3 text-white" />
                        </div>
                      )}

                      {/* Comment indicator */}
                      {progression.comment && (
                        <div className="absolute top-1 right-1 p-1 rounded bg-black/60">
                          <MessageSquareText className="h-3 w-3 text-white" />
                        </div>
                      )}

                      {/* Step number */}
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs font-medium">
                        {index + 1}
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-medium">
                      {t("stepOf", {
                        current: index + 1,
                        total: progressions.length,
                      })}
                    </p>
                    {progression.comment && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {progression.comment}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </div>
            ))}
          </TooltipProvider>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <ProgressionLightbox
          progressions={progressions}
          currentIndex={lightboxIndex}
          isOpen={true}
          onClose={handleLightboxClose}
          onIndexChange={setLightboxIndex}
          submissionTitle={submissionTitle}
          protectionEnabled={protectionEnabled}
        />
      )}
    </>
  );
}
