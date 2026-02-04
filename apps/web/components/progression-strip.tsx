"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronRight, FileText, MessageSquareText } from "lucide-react";
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
      <div className="mt-8">
        {/* Section header */}
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {t("title")}
        </h3>

        {/* Horizontal scrollable strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
          <TooltipProvider delayDuration={300}>
            {progressions.map((progression, index) => (
              <div key={progression.id} className="flex items-center">
                {/* Thumbnail */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleThumbnailClick(index)}
                      className="relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary/50 focus:border-primary focus:outline-none transition-all group bg-muted"
                      aria-label={t("viewProgression")}
                    >
                      {progression.imageUrl ? (
                        <Image
                          src={progression.imageUrl}
                          alt={`${t("progressionStep", { step: index + 1 })}`}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 80px, 96px"
                        />
                      ) : (
                        // Text-only progression
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <FileText className="h-8 w-8 text-muted-foreground" />
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

                {/* Arrow between thumbnails (except after last) */}
                {index < progressions.length - 1 && (
                  <ChevronRight className="h-5 w-5 text-muted-foreground/50 flex-shrink-0 mx-1" />
                )}
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
