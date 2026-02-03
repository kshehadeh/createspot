"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CritiquesPanel } from "@/components/critiques-panel";
import { SubmissionImage } from "@/components/submission-image";
import { ExpandableText } from "@/components/expandable-text";
import { Card, CardContent } from "@/components/ui/card";
import { ImageSelectionOverlay } from "@/components/image-selection-overlay";
import { TextSelectionHandler } from "@/components/text-selection-handler";
import { CritiqueSelectionModal } from "@/components/critique-selection-modal";
import { HintPopover } from "@/components/hint-popover";
import { usePageHints } from "@/lib/hooks/use-page-hints";
import type { SelectionDataInput } from "@/lib/critique-fragments";

interface CritiquesPageContentProps {
  submission: {
    id: string;
    title: string | null;
    imageUrl: string | null;
    imageFocalPoint?: { x: number; y: number } | null;
    text: string | null;
    user: { id: string; name: string | null; slug: string | null };
    tags: string[];
  };
  creatorid: string;
  isOwner: boolean;
  currentUserId: string;
  submissionPageHref: string;
  tutorialData?: any;
}

function SubmissionPanel({
  submission,
  isOwner,
  onSelectionComplete,
}: {
  submission: CritiquesPageContentProps["submission"];
  isOwner: boolean;
  onSelectionComplete: (
    selection: SelectionDataInput,
    imageUrl?: string,
  ) => void;
}) {
  const t = useTranslations("critique");
  const tSubmission = useTranslations("submission");
  const tExhibition = useTranslations("exhibition");
  const hasImage = !!submission.imageUrl;
  const hasText = !!submission.text;

  const handleImageSelection = (selection: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    onSelectionComplete(
      {
        type: "image",
        x: selection.x,
        y: selection.y,
        width: selection.width,
        height: selection.height,
      },
      submission.imageUrl || undefined,
    );
  };

  const handleTextSelection = (selection: {
    startIndex: number;
    endIndex: number;
    originalText: string;
  }) => {
    onSelectionComplete({
      type: "text",
      ...selection,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {!isOwner && (hasImage || hasText) && (
        <p className="text-sm text-muted-foreground">
          {t("selectionInstruction")}
        </p>
      )}
      {hasImage && (
        <div className="relative w-full">
          <div className="relative">
            <SubmissionImage
              imageUrl={submission.imageUrl!}
              alt={submission.title || tSubmission("submissionAlt")}
              tags={submission.tags}
              heightClasses="h-[65vh] sm:h-[72vh]"
              protectionEnabled={false}
            />
            {!isOwner && (
              <ImageSelectionOverlay
                imageUrl={submission.imageUrl!}
                onSelectionComplete={handleImageSelection}
                disabled={false}
              />
            )}
          </div>
        </div>
      )}
      {hasText && (
        <Card className="rounded-xl">
          <CardContent className="p-6">
            {!isOwner ? (
              <TextSelectionHandler
                onSelectionComplete={handleTextSelection}
                disabled={false}
              >
                <ExpandableText
                  text={submission.text!}
                  title={submission.title}
                />
              </TextSelectionHandler>
            ) : (
              <ExpandableText
                text={submission.text!}
                title={submission.title}
              />
            )}
          </CardContent>
        </Card>
      )}
      {!hasImage && !hasText && (
        <p className="text-sm text-muted-foreground">
          {tExhibition("untitled")}
        </p>
      )}
    </div>
  );
}

export function CritiquesPageContent({
  submission,
  creatorid: _creatorid,
  isOwner,
  currentUserId,
  submissionPageHref,
  tutorialData,
}: CritiquesPageContentProps) {
  const t = useTranslations("critique");
  const tExhibition = useTranslations("exhibition");
  const [selectionModalOpen, setSelectionModalOpen] = useState(false);
  const [currentSelection, setCurrentSelection] =
    useState<SelectionDataInput | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>();

  const handleSelectionComplete = (
    selection: SelectionDataInput,
    imageUrl?: string,
  ) => {
    setCurrentSelection(selection);
    setCurrentImageUrl(imageUrl);
    setSelectionModalOpen(true);
  };

  const handleCritiqueSuccess = () => {
    // Refresh critiques panel - it will refetch automatically via useEffect
    window.location.reload();
  };

  const nextHint = usePageHints({
    tutorialData: tutorialData || null,
    page: "critiques-view",
    context: { canCritique: !isOwner },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {t.rich(isOwner ? "allCritiquesFor" : "yourCritiquesFor", {
              title: submission.title || tExhibition("untitled"),
              link: (chunks) => (
                <Link
                  href={submissionPageHref}
                  className="font-bold hover:underline focus:underline focus:outline-none"
                >
                  {chunks}
                </Link>
              ),
            })}
          </h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="min-w-0 overflow-y-auto">
            <CritiquesPanel
              submissionId={submission.id}
              isOwner={isOwner}
              currentUserId={currentUserId}
              submissionTitle={submission.title}
            />
          </div>

          <aside className="relative md:sticky md:top-6 md:max-h-[calc(100vh-8rem)] overflow-visible">
            <div
              className="absolute -left-8 top-0 z-10 hidden h-0.5 w-8 bg-primary/30 pointer-events-none lg:block"
              aria-hidden
            />
            <div className="md:max-h-[calc(100vh-8rem)] md:overflow-y-auto lg:border-l-2 lg:border-primary/30 lg:pl-8">
              <SubmissionPanel
                submission={submission}
                isOwner={isOwner}
                onSelectionComplete={handleSelectionComplete}
              />
            </div>
          </aside>
        </div>
      </div>

      <CritiqueSelectionModal
        submissionId={submission.id}
        selectionData={currentSelection}
        imageUrl={currentImageUrl}
        open={selectionModalOpen}
        onClose={() => {
          setSelectionModalOpen(false);
          setCurrentSelection(null);
          setCurrentImageUrl(undefined);
        }}
        onSuccess={handleCritiqueSuccess}
      />

      {nextHint && (
        <HintPopover
          hintKey={nextHint.key}
          page="critiques-view"
          title={nextHint.title}
          description={nextHint.description}
          shouldShow={true}
          order={nextHint.order}
          showArrow={nextHint.showArrow ?? false}
          fixedPosition={nextHint.fixedPosition}
          targetSelector={nextHint.targetSelector}
          side={nextHint.side}
        />
      )}
    </div>
  );
}
