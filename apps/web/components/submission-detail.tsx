"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CollectionDownloadDropdown } from "@/components/collection-download-dropdown";
import { CritiqueButton } from "@/components/critique-button";
import { ExpandableText } from "@/components/expandable-text";
import { FavoriteButton } from "@/components/favorite-button";
import { FavoritesProvider } from "@/components/favorites-provider";
import { HintPopover } from "@/components/hint-popover";
import { ProgressionStrip } from "@/components/progression-strip";
import { ShareButton } from "@/components/share-button";
import { SocialLinks } from "@/components/social-links";
import { SubmissionImage } from "@/components/submission-image";
import { SubmissionLightbox } from "@/components/submission-lightbox";
import { SubmissionMobileMenu } from "@/components/submission-mobile-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  VisuallyHidden,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageHints } from "@/lib/hooks/use-page-hints";
import { useTrackSubmissionView } from "@/lib/hooks/use-track-submission-view";
import { getCreatorUrl } from "@/lib/utils";

interface ProgressionData {
  id: string;
  imageUrl: string | null;
  text: string | null;
  comment: string | null;
  order: number;
}

interface SubmissionDetailProps {
  submission: {
    id: string;
    title: string | null;
    imageUrl: string | null;
    imageFocalPoint?: { x: number; y: number } | null;
    text: string | null;
    wordIndex: number | null;
    category: string | null;
    tags: string[];
    shareStatus?: "PRIVATE" | "PROFILE" | "PUBLIC";
    critiquesEnabled?: boolean;
    isWorkInProgress?: boolean;
    referenceImageUrl?: string | null;
    user: {
      id: string;
      name: string | null;
      image: string | null;
      bio: string | null;
      slug?: string | null;
      instagram: string | null;
      twitter: string | null;
      linkedin: string | null;
      website: string | null;
    };
    prompt: {
      id: string;
      word1: string;
      word2: string;
      word3: string;
    } | null;
    _count: {
      favorites: number;
    };
    progressions?: ProgressionData[];
  };
  isLoggedIn: boolean;
  isOwner?: boolean;
  currentUserId?: string | null;
  tutorialData?: any;
}

export function SubmissionDetail({
  submission: initialSubmission,
  isLoggedIn,
  isOwner = false,
  currentUserId,
  tutorialData,
}: SubmissionDetailProps) {
  const tExhibition = useTranslations("exhibition");
  const tSubmission = useTranslations("submission");
  const tProfile = useTranslations("profile");
  const tReference = useTranslations("reference");
  const tProgression = useTranslations("progression");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isReferenceLightboxOpen, setIsReferenceLightboxOpen] = useState(false);

  // Local state for submission data that can be updated after editing
  const [submission] = useState(initialSubmission);

  // Get the next hint to show using the hook
  // The hook looks up hints from centralized config and handles all logic
  // Context is used for conditional hints (e.g., critiquesEnabled)
  const nextHint = usePageHints({
    tutorialData: tutorialData || null,
    page: "submission-view",
    context: { critiquesEnabled: submission.critiquesEnabled },
  });

  // Track view when component mounts (only if not the owner)
  useTrackSubmissionView(submission.id, isOwner);

  const hasImage = !!submission.imageUrl;
  const hasText = !!submission.text;
  const hasJourney = (submission.progressions?.length ?? 0) > 0;
  const hasReference = !!submission.referenceImageUrl;
  const hasProgressionsGif =
    (submission.progressions?.filter((p) => p.imageUrl).length ?? 0) >= 2;

  const getWord = (): string => {
    if (!submission.prompt || !submission.wordIndex) return "";
    const words = [
      submission.prompt.word1,
      submission.prompt.word2,
      submission.prompt.word3,
    ];
    return words[submission.wordIndex - 1];
  };

  const isWip = submission.isWorkInProgress;

  type SubmissionTabKey = "image" | "text" | "journey" | "reference";
  const tabKeys: SubmissionTabKey[] = (
    ["image", "text", "journey", "reference"] as const
  ).filter((key) => {
    if (key === "image") return hasImage;
    if (key === "text") return hasText;
    if (key === "journey") return hasJourney;
    if (key === "reference") return hasReference;
    return false;
  });

  // For WIP submissions without main content, default to journey tab
  const defaultTab =
    isWip && !hasImage && !hasText && hasJourney ? "journey" : tabKeys[0];

  const renderImagePanel = () => (
    <div className="mb-8">
      <SubmissionImage
        imageUrl={submission.imageUrl!}
        alt={submission.title || tSubmission("submissionAlt")}
        tags={submission.tags}
        onExpand={() => setIsLightboxOpen(true)}
      />
    </div>
  );

  const renderTextPanel = () => (
    <div className="mx-auto max-w-3xl">
      <Card className="rounded-xl">
        <CardContent className="p-6">
          {submission.title && (
            <h1 className="mb-4 text-2xl font-semibold text-foreground">
              {submission.title}
            </h1>
          )}
          <ExpandableText text={submission.text!} title={submission.title} />
        </CardContent>
      </Card>
    </div>
  );

  const renderJourneyPanel = () => (
    <div className="mt-8">
      {submission.progressions && submission.progressions.length > 0 && (
        <ProgressionStrip
          progressions={submission.progressions}
          submissionTitle={submission.title}
        />
      )}
    </div>
  );

  const renderReferencePanel = () => (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        {tReference("title")}
      </h3>
      <button
        onClick={() => setIsReferenceLightboxOpen(true)}
        className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary/50 focus:border-primary focus:outline-none transition-all group bg-muted"
        aria-label={tReference("viewReference")}
      >
        <Image
          src={submission.referenceImageUrl!}
          alt={tReference("title")}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 128px, 160px"
        />
      </button>
    </div>
  );

  const tabLabels: Record<SubmissionTabKey, string> = {
    image: tSubmission("image"),
    text: tSubmission("text"),
    journey: tProgression("title"),
    reference: tReference("title"),
  };

  return (
    <FavoritesProvider
      isLoggedIn={isLoggedIn}
      initialSubmissionIds={[submission.id]}
    >
      <div className="min-h-screen bg-background">
        {/* Header with title, user, and actions */}
        <Card className="rounded-none border-x-0 border-t-0">
          <div className="mx-auto max-w-7xl px-6 py-4">
            {/* Mobile: title dropdown + creator line */}
            <div className="md:hidden flex flex-col gap-2">
              <SubmissionMobileMenu
                submission={{
                  id: submission.id,
                  title: submission.title,
                  shareStatus: submission.shareStatus,
                  critiquesEnabled: submission.critiquesEnabled,
                  _count: submission._count,
                  user: submission.user,
                }}
                isOwner={isOwner}
                isLoggedIn={isLoggedIn}
                currentUserId={currentUserId}
                hasImage={hasImage}
                hasProgressionsGif={hasProgressionsGif}
              />
              <div className="flex items-center gap-2">
                <Link
                  href={getCreatorUrl(submission.user)}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {submission.user.name || tProfile("anonymous")}
                </Link>
                {(submission.user.instagram ||
                  submission.user.twitter ||
                  submission.user.linkedin ||
                  submission.user.website) && (
                  <SocialLinks
                    instagram={submission.user.instagram}
                    twitter={submission.user.twitter}
                    linkedin={submission.user.linkedin}
                    website={submission.user.website}
                    variant="minimal"
                  />
                )}
              </div>
            </div>

            {/* Desktop: full header with inline actions */}
            <div className="hidden md:block">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold leading-[1.3] text-foreground sm:text-2xl">
                      {submission.title || tExhibition("untitled")}
                    </h1>
                    <ShareButton
                      type="submission"
                      submissionId={submission.id}
                      className="shrink-0"
                      userId={submission.user.id}
                      userSlug={submission.user.slug}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={getCreatorUrl(submission.user)}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {submission.user.name || tProfile("anonymous")}
                    </Link>
                    {(submission.user.instagram ||
                      submission.user.twitter ||
                      submission.user.linkedin ||
                      submission.user.website) && (
                      <SocialLinks
                        instagram={submission.user.instagram}
                        twitter={submission.user.twitter}
                        linkedin={submission.user.linkedin}
                        website={submission.user.website}
                        variant="minimal"
                      />
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    {isOwner && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-1.5"
                      >
                        <Link
                          href={`${getCreatorUrl(submission.user)}/s/${submission.id}/edit`}
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          {tSubmission("edit")}
                        </Link>
                      </Button>
                    )}
                    {isOwner && (hasImage || hasProgressionsGif) && (
                      <CollectionDownloadDropdown
                        variant="submission"
                        submissionId={submission.id}
                        submissionTitle={submission.title || "submission"}
                        hasImage={hasImage}
                        hasProgressionsGif={hasProgressionsGif}
                      />
                    )}
                    {isLoggedIn &&
                      submission.critiquesEnabled &&
                      (isOwner || submission.shareStatus === "PUBLIC") && (
                        <CritiqueButton
                          submissionId={submission.id}
                          critiquesEnabled={submission.critiquesEnabled}
                          isOwner={isOwner}
                          currentUserId={currentUserId}
                          submissionTitle={submission.title}
                          user={submission.user}
                        />
                      )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isLoggedIn && (
                      <FavoriteButton submissionId={submission.id} size="md" />
                    )}
                    {submission._count.favorites > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {submission._count.favorites}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* WIP banner */}
        {isWip && (
          <div className="mx-auto max-w-7xl px-6 pt-4">
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              {tSubmission("wipBanner")}
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="mx-auto max-w-7xl px-6 py-6">
          {tabKeys.length === 0 ? null : tabKeys.length === 1 ? (
            <div className="mb-12">
              {tabKeys[0] === "image" && renderImagePanel()}
              {tabKeys[0] === "text" && renderTextPanel()}
              {tabKeys[0] === "journey" && renderJourneyPanel()}
              {tabKeys[0] === "reference" && renderReferencePanel()}
            </div>
          ) : (
            <Tabs defaultValue={defaultTab} className="mb-12 w-full">
              <TabsList className="mb-6 flex w-full flex-wrap gap-2 bg-muted p-1">
                {tabKeys.map((key) => (
                  <TabsTrigger key={key} value={key}>
                    {tabLabels[key]}
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabKeys.map((key) => (
                <TabsContent key={key} value={key} className="mt-0">
                  {key === "image" && renderImagePanel()}
                  {key === "text" && renderTextPanel()}
                  {key === "journey" && renderJourneyPanel()}
                  {key === "reference" && renderReferencePanel()}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </main>
      </div>

      {hasImage && (
        <SubmissionLightbox
          submission={{
            id: submission.id,
            title: submission.title,
            imageUrl: submission.imageUrl,
            text: submission.text,
            shareStatus: submission.shareStatus ?? "PUBLIC",
            critiquesEnabled: submission.critiquesEnabled ?? false,
            user: submission.user,
            _count: submission._count,
          }}
          word={getWord()}
          onClose={() => setIsLightboxOpen(false)}
          isOpen={isLightboxOpen}
          hideGoToSubmission={true}
          currentUserId={currentUserId}
        />
      )}

      {submission.referenceImageUrl && (
        <Dialog
          open={isReferenceLightboxOpen}
          onOpenChange={setIsReferenceLightboxOpen}
        >
          <DialogContent className="max-w-4xl border-none bg-black/95 p-0">
            <VisuallyHidden>
              <DialogTitle>{tReference("viewReference")}</DialogTitle>
            </VisuallyHidden>
            <div className="relative flex items-center justify-center p-4">
              <Image
                src={submission.referenceImageUrl}
                alt={tReference("title")}
                width={1200}
                height={900}
                className="max-h-[80vh] w-auto rounded object-contain"
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {nextHint && (
        <HintPopover
          hintKey={nextHint.key}
          page="submission-view"
          title={nextHint.title}
          description={nextHint.description}
          targetSelector={nextHint.targetSelector}
          side={nextHint.side}
          shouldShow={true}
          order={nextHint.order}
          showArrow={nextHint.showArrow ?? true}
          fixedPosition={nextHint.fixedPosition}
        />
      )}
    </FavoritesProvider>
  );
}
