"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X, FileText, MessageSquareText } from "lucide-react";
import {
  BaseLightbox,
  BaseLightboxNavigation,
  BaseLightboxRenderContext,
  LIGHTBOX_BUTTON_CLASS,
} from "@/components/base-lightbox";

export interface ProgressionItem {
  id: string;
  imageUrl: string | null;
  text: string | null;
  comment: string | null;
  order: number;
}

interface ProgressionLightboxProps {
  /** Array of all progressions for navigation */
  progressions: ProgressionItem[];
  /** Index of the currently displayed progression */
  currentIndex: number;
  /** Whether the lightbox is open */
  isOpen: boolean;
  /** Callback when lightbox should close */
  onClose: () => void;
  /** Callback when navigating to a different progression */
  onIndexChange: (index: number) => void;
  /** Optional submission title for context */
  submissionTitle?: string | null;
  /** Whether to enable download protection. Default: true */
  protectionEnabled?: boolean;
}

export function ProgressionLightbox({
  progressions,
  currentIndex,
  isOpen,
  onClose,
  onIndexChange,
  submissionTitle,
  protectionEnabled = true,
}: ProgressionLightboxProps) {
  const t = useTranslations("progression");
  const [closeTooltipOpen, setCloseTooltipOpen] = useState(false);
  const closeTooltipCleanupRef = useRef<(() => void) | null>(null);

  const currentProgression = progressions[currentIndex];
  const hasImage = !!currentProgression?.imageUrl;
  const hasText = !!currentProgression?.text;
  const hasComment = !!currentProgression?.comment;

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < progressions.length - 1;

  const handleGoToPrevious = useCallback(() => {
    if (hasPrevious) {
      onIndexChange(currentIndex - 1);
    }
  }, [hasPrevious, currentIndex, onIndexChange]);

  const handleGoToNext = useCallback(() => {
    if (hasNext) {
      onIndexChange(currentIndex + 1);
    }
  }, [hasNext, currentIndex, onIndexChange]);

  // Navigation configuration for BaseLightbox
  const navigation: BaseLightboxNavigation = {
    onGoToPrevious: handleGoToPrevious,
    onGoToNext: handleGoToNext,
    hasPrevious,
    hasNext,
    nextImageUrl: hasNext ? progressions[currentIndex + 1]?.imageUrl : null,
    prevImageUrl: hasPrevious ? progressions[currentIndex - 1]?.imageUrl : null,
    prevLabel: t("previousStep"),
    nextLabel: t("nextStep"),
  };

  // Render sidebar content (desktop)
  const renderSidebar = useCallback(
    (_context: BaseLightboxRenderContext) => (
      <>
        {/* Progress indicator and comment */}
        <div className="flex-shrink-0 p-6 xl:p-8 pb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground/70 mb-3">
            <span>
              {t("stepOf", {
                current: currentIndex + 1,
                total: progressions.length,
              })}
            </span>
          </div>
          {hasComment && (
            <div className="flex items-start gap-2 mb-4">
              <MessageSquareText className="h-4 w-4 mt-1 text-muted-foreground/50 flex-shrink-0" />
              <p className="text-sm text-muted-foreground/80 italic">
                {currentProgression.comment}
              </p>
            </div>
          )}
          {submissionTitle && (
            <h2 className="text-xl font-semibold text-muted-foreground">
              {submissionTitle}
            </h2>
          )}
        </div>

        {/* Text content (the creative work) */}
        {hasText && (
          <div className="flex-1 overflow-y-auto px-6 xl:px-8 pb-6 xl:pb-8">
            <div
              className="prose prose-lg prose-invert max-w-none text-muted-foreground prose-headings:text-muted-foreground prose-p:text-muted-foreground prose-strong:text-muted-foreground prose-em:text-muted-foreground prose-a:text-muted-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-li:text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: currentProgression.text! }}
            />
          </div>
        )}
      </>
    ),
    [
      currentIndex,
      progressions.length,
      hasComment,
      hasText,
      currentProgression,
      submissionTitle,
      t,
    ],
  );

  // Render metadata overlay (mobile)
  const renderMetadataOverlay = useCallback(
    () => (
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="text-white font-medium text-sm sm:text-base">
          {t("stepOf", {
            current: currentIndex + 1,
            total: progressions.length,
          })}
        </span>
        {hasComment && (
          <span className="text-zinc-300 text-xs sm:text-sm line-clamp-1">
            {currentProgression.comment}
          </span>
        )}
      </div>
    ),
    [currentIndex, progressions.length, hasComment, currentProgression, t],
  );

  // Render control buttons
  const renderControls = useCallback(
    (context: BaseLightboxRenderContext) => (
      <>
        {/* Text overlay button - mobile only when text exists */}
        {hasText && hasImage && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  context.setIsTextOverlayOpen(true);
                }}
                className={`xl:hidden ${LIGHTBOX_BUTTON_CLASS}`}
                aria-label={t("viewText")}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("viewText")}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Close button */}
        <Tooltip open={closeTooltipOpen} onOpenChange={() => {}}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              onMouseEnter={() => {
                closeTooltipCleanupRef.current?.();
                closeTooltipCleanupRef.current =
                  handleTooltipHover(true) ?? null;
              }}
              onMouseLeave={() => {
                closeTooltipCleanupRef.current?.();
                closeTooltipCleanupRef.current = null;
                handleTooltipHover(false);
              }}
              className={LIGHTBOX_BUTTON_CLASS}
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("close")}</p>
          </TooltipContent>
        </Tooltip>
      </>
    ),
    [hasText, hasImage, closeTooltipOpen, onClose, t],
  );

  // Render text overlay content
  const renderTextOverlay = useCallback(
    () => (
      <>
        {hasComment && (
          <div className="flex items-start gap-2 mb-4 pb-4 border-b border-zinc-700">
            <MessageSquareText className="h-4 w-4 mt-1 text-zinc-400 flex-shrink-0" />
            <p className="text-sm text-zinc-400 italic">
              {currentProgression.comment}
            </p>
          </div>
        )}
        <div
          className="prose prose-lg prose-invert max-w-none text-white"
          dangerouslySetInnerHTML={{ __html: currentProgression.text! }}
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          aria-label={t("closeTextOverlay")}
        >
          <X className="h-6 w-6" />
        </Button>
      </>
    ),
    [hasComment, currentProgression, t],
  );

  // Handle tooltip state: show close tooltip after 300ms hover
  const handleTooltipHover = useCallback((hovered: boolean) => {
    if (hovered) {
      const timer = setTimeout(() => setCloseTooltipOpen(true), 300);
      return () => clearTimeout(timer);
    }
    setCloseTooltipOpen(false);
  }, []);

  if (!currentProgression) {
    return null;
  }

  return (
    <BaseLightbox
      item={{
        id: currentProgression.id,
        imageUrl: currentProgression.imageUrl,
        text: currentProgression.text,
        title: null, // Progressions don't have individual titles
      }}
      isOpen={isOpen}
      onClose={onClose}
      dialogTitle={
        submissionTitle
          ? t("progressionForSubmission", { title: submissionTitle })
          : t("progressionStep", { step: currentIndex + 1 })
      }
      protectionEnabled={protectionEnabled}
      navigation={navigation}
      renderControls={renderControls}
      renderSidebar={hasImage ? renderSidebar : undefined}
      renderMetadataOverlay={renderMetadataOverlay}
      renderTextOverlay={hasText ? renderTextOverlay : undefined}
    />
  );
}
