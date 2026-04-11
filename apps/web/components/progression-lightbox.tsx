"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@createspot/ui-primitives/button";
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
  /** Snapshot during BaseLightbox slide transition so the outgoing panel shows the correct step. */
  const [outgoingProgression, setOutgoingProgression] =
    useState<ProgressionItem | null>(null);

  const currentProgression = progressions[currentIndex];
  const hasImage = !!currentProgression?.imageUrl;
  const hasText = !!currentProgression?.text;
  const hasComment = !!currentProgression?.comment;

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < progressions.length - 1;

  const handleGoToPrevious = useCallback(() => {
    if (hasPrevious && currentProgression) {
      setOutgoingProgression(currentProgression);
      onIndexChange(currentIndex - 1);
    }
  }, [hasPrevious, currentIndex, currentProgression, onIndexChange]);

  const handleGoToNext = useCallback(() => {
    if (hasNext && currentProgression) {
      setOutgoingProgression(currentProgression);
      onIndexChange(currentIndex + 1);
    }
  }, [hasNext, currentIndex, currentProgression, onIndexChange]);

  const progressionForPanel = useCallback(
    (context: BaseLightboxRenderContext) =>
      context.slideRole === "outgoing" && outgoingProgression
        ? outgoingProgression
        : currentProgression,
    [outgoingProgression, currentProgression],
  );

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
    (context: BaseLightboxRenderContext) => {
      const prog = progressionForPanel(context);
      const idx = progressions.findIndex((p) => p.id === prog.id);
      const stepDisplay = idx >= 0 ? idx + 1 : currentIndex + 1;
      const panelHasComment = !!prog.comment;
      const panelHasText = !!prog.text;
      return (
        <>
          {/* Progress indicator and comment */}
          <div className="flex-shrink-0 p-6 xl:p-8 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground/70 mb-3">
              <span>
                {t("stepOf", {
                  current: stepDisplay,
                  total: progressions.length,
                })}
              </span>
            </div>
            {panelHasComment && (
              <div className="flex items-start gap-2 mb-4">
                <MessageSquareText className="h-4 w-4 mt-1 text-muted-foreground/50 flex-shrink-0" />
                <p className="text-sm text-muted-foreground/80 italic">
                  {prog.comment}
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
          {panelHasText && (
            <div className="flex-1 overflow-y-auto px-6 xl:px-8 pb-6 xl:pb-8">
              <div
                className="prose prose-lg prose-invert max-w-none text-muted-foreground prose-headings:text-muted-foreground prose-p:text-muted-foreground prose-strong:text-muted-foreground prose-em:text-muted-foreground prose-a:text-muted-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-li:text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: prog.text! }}
              />
            </div>
          )}
        </>
      );
    },
    [progressionForPanel, progressions, currentIndex, submissionTitle, t],
  );

  // Render metadata overlay (mobile)
  const renderMetadataOverlay = useCallback(
    (context: BaseLightboxRenderContext) => {
      const prog = progressionForPanel(context);
      const idx = progressions.findIndex((p) => p.id === prog.id);
      const stepDisplay = idx >= 0 ? idx + 1 : currentIndex + 1;
      const panelHasComment = !!prog.comment;
      return (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-white font-medium text-sm sm:text-base">
            {t("stepOf", {
              current: stepDisplay,
              total: progressions.length,
            })}
          </span>
          {panelHasComment && (
            <span className="text-zinc-300 text-xs sm:text-sm line-clamp-1">
              {prog.comment}
            </span>
          )}
        </div>
      );
    },
    [progressionForPanel, progressions, currentIndex, t],
  );

  // Handle tooltip state: show close tooltip after 300ms hover (must be above renderControls closure)
  useEffect(() => {
    if (!isOpen) {
      setOutgoingProgression(null);
    }
  }, [isOpen]);

  const handleTooltipHover = useCallback((hovered: boolean) => {
    if (hovered) {
      const timer = setTimeout(() => setCloseTooltipOpen(true), 300);
      return () => clearTimeout(timer);
    }
    setCloseTooltipOpen(false);
  }, []);

  // Render control buttons
  const renderControls = useCallback(
    (context: BaseLightboxRenderContext) => (
      <>
        {/* Text overlay button - mobile only when text exists */}
        {hasText && hasImage && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="overlayDark"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  context.setIsTextOverlayOpen(true);
                }}
                className="xl:hidden"
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
              variant="overlayDark"
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
    [hasText, hasImage, closeTooltipOpen, onClose, t, handleTooltipHover],
  );

  // Render text overlay content
  const renderTextOverlay = useCallback(
    (context: BaseLightboxRenderContext) => (
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
          variant="overlayDark"
          size="icon"
          className="absolute right-4 top-4"
          aria-label={t("closeTextOverlay")}
          onClick={() => context.setIsTextOverlayOpen(false)}
        >
          <X className="h-6 w-6" />
        </Button>
      </>
    ),
    [hasComment, currentProgression, t],
  );

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
      onNavTransitionComplete={() => setOutgoingProgression(null)}
      renderControls={renderControls}
      renderSidebar={hasImage ? renderSidebar : undefined}
      renderMetadataOverlay={renderMetadataOverlay}
      renderTextOverlay={hasText ? renderTextOverlay : undefined}
    />
  );
}
