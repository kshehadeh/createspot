"use client";

import Image from "next/image";
import { MessageCircle, Pencil } from "lucide-react";
import Link from "@/components/link";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { CollectionDownloadDropdown } from "@/components/collection-download-dropdown";
import { CommentViewerModal } from "@/components/comment-viewer-modal";
import { CritiqueButton } from "@/components/critique-button";
import { CreatorHubHeaderLayout } from "@/components/creator-hub-header-layout";
import { ExpandableText } from "@/components/expandable-text";
import { FavoriteButton } from "@/components/favorite-button";
import { FavoritesProvider } from "@/components/favorites-provider";
import { HintPopover } from "@/components/hint-popover";
import { ProgressionStrip } from "@/components/progression-strip";
import { ShareButton } from "@/components/share-button";
import { SocialLinks } from "@/components/social-links";
import { PageLayout } from "@/components/page-layout";
import { PageSubtitle, PageTitle } from "@/components/page-title";
import { SubmissionImage } from "@/components/submission-image";
import { SubmissionLightbox } from "@/components/submission-lightbox";
import { SubmissionMobileMenu } from "@/components/submission-mobile-menu";
import { Button, buttonVariants } from "@createspot/ui-primitives/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  VisuallyHidden,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePageHints } from "@/lib/hooks/use-page-hints";
import { useTrackSubmissionView } from "@/lib/hooks/use-track-submission-view";
import { cn, getCreatorUrl } from "@/lib/utils";

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
    category: string | null;
    tags: string[];
    shareStatus?: "PRIVATE" | "PROFILE" | "PUBLIC";
    critiquesEnabled?: boolean;
    commentsEnabled?: boolean;
    isWorkInProgress?: boolean;
    referenceImageUrl?: string | null;
    user: {
      id: string;
      name: string | null;
      image: string | null;
      profileImageUrl?: string | null;
      bio: string | null;
      slug?: string | null;
      instagram: string | null;
      twitter: string | null;
      linkedin: string | null;
      website: string | null;
    };
    _count: {
      favorites: number;
      comments: number;
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
  const tFeed = useTranslations("feed");
  const tSubmission = useTranslations("submission");
  const tProfile = useTranslations("profile");
  const tReference = useTranslations("reference");
  const tProgression = useTranslations("progression");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isReferenceLightboxOpen, setIsReferenceLightboxOpen] = useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(
    initialSubmission._count.comments,
  );
  const [mounted, setMounted] = useState(false);

  // Local state for submission data that can be updated after editing
  const [submission] = useState(initialSubmission);

  const creatorAvatar = useMemo(
    () =>
      submission.user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={submission.user.image}
          alt=""
          className="h-12 w-12 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-lowest">
          <span className="text-lg font-medium text-on-surface-variant">
            {submission.user.name?.charAt(0) || "?"}
          </span>
        </div>
      ),
    [submission.user.image, submission.user.name],
  );

  // Defer Radix UI (Tabs, DropdownMenu) until after mount to avoid hydration mismatch:
  // Radix generates stable useId()s per tree position; server/client can differ and cause ID mismatch.
  useEffect(() => {
    setMounted(true);
  }, []);

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

  const isWip = submission.isWorkInProgress;
  const showComments = submission.commentsEnabled ?? true;

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
    <div className="w-full">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        {tReference("title")}
      </h3>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setIsReferenceLightboxOpen(true)}
        className="relative h-auto w-full max-h-[70vh] aspect-video rounded-lg overflow-hidden border-2 border-transparent p-0 hover:border-primary/50 hover:bg-muted focus-visible:border-primary focus-visible:ring-0 group"
        aria-label={tReference("viewReference")}
      >
        <Image
          src={submission.referenceImageUrl!}
          alt={tReference("title")}
          fill
          className="object-contain transition-transform group-hover:scale-[1.02]"
          sizes="(max-width: 1024px) 100vw, 1280px"
        />
      </Button>
    </div>
  );

  const tabLabels: Record<SubmissionTabKey, string> = {
    image: tSubmission("image"),
    text: tSubmission("text"),
    journey: tProgression("title"),
    reference: tReference("title"),
  };

  // Before mount: render a static shell (no Radix) to avoid hydration ID mismatch.
  if (!mounted) {
    return (
      <FavoritesProvider
        isLoggedIn={isLoggedIn}
        initialSubmissionIds={[submission.id]}
      >
        <PageLayout maxWidth="max-w-6xl">
          <div className="mb-8 w-full min-w-0">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
              <CreatorHubHeaderLayout
                className="min-w-0 flex-1"
                avatar={creatorAvatar}
              >
                <PageTitle>
                  {submission.title || tExhibition("untitled")}
                </PageTitle>
                <div className="flex flex-wrap items-center gap-3">
                  <PageSubtitle className="mt-0">
                    <Link
                      href={getCreatorUrl(submission.user)}
                      className="transition-colors hover:text-foreground"
                    >
                      {submission.user.name || tProfile("anonymous")}
                    </Link>
                  </PageSubtitle>
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
              </CreatorHubHeaderLayout>
            </div>
          </div>
          <div className="mb-12 min-h-[40vh]" aria-hidden />
        </PageLayout>
      </FavoritesProvider>
    );
  }

  return (
    <FavoritesProvider
      isLoggedIn={isLoggedIn}
      initialSubmissionIds={[submission.id]}
    >
      <PageLayout maxWidth="max-w-6xl">
        <div className="mb-8 w-full min-w-0">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
            <CreatorHubHeaderLayout
              className="min-w-0 flex-1"
              avatar={creatorAvatar}
            >
              <div className="flex items-start justify-between gap-4">
                <PageTitle className="min-w-0 flex-1">
                  {submission.title || tExhibition("untitled")}
                </PageTitle>
                <div className="hidden shrink-0 flex-wrap items-center justify-end gap-1 pt-0.5 md:flex">
                  <ShareButton
                    type="submission"
                    submissionId={submission.id}
                    userId={submission.user.id}
                    userSlug={submission.user.slug}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "icon" }),
                      "h-10 w-10 shrink-0",
                    )}
                  />
                  {isOwner && (hasImage || hasProgressionsGif) && (
                    <CollectionDownloadDropdown
                      variant="submission"
                      submissionId={submission.id}
                      submissionTitle={submission.title || "submission"}
                      hasImage={hasImage}
                      hasProgressionsGif={hasProgressionsGif}
                      toolbarIconTrigger
                    />
                  )}
                  {isOwner && (
                    <Button
                      asChild
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                    >
                      <Link
                        href={`${getCreatorUrl(submission.user)}/s/${submission.id}/edit`}
                        aria-label={tSubmission("edit")}
                        title={tSubmission("edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
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
                        toolbarIcon
                      />
                    )}
                  {showComments && (
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className={cn(
                              "h-10 w-10 shrink-0",
                              commentCount > 0 && "gap-0.5",
                            )}
                            onClick={() => setCommentsModalOpen(true)}
                            aria-label={tFeed("commentsCount", {
                              count: commentCount,
                            })}
                          >
                            <MessageCircle
                              className={cn(
                                "shrink-0 text-muted-foreground",
                                commentCount > 0
                                  ? "h-3.5 w-3.5"
                                  : "h-4 w-4",
                              )}
                            />
                            {commentCount > 0 && (
                              <span className="text-[11px] tabular-nums leading-none text-muted-foreground">
                                {commentCount}
                              </span>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{tExhibition("comments")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {isLoggedIn && (
                    <FavoriteButton
                      submissionId={submission.id}
                      count={submission._count.favorites}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "icon" }),
                        "h-10 shrink-0",
                      )}
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <PageSubtitle className="mt-0">
                  <Link
                    href={getCreatorUrl(submission.user)}
                    className="transition-colors hover:text-foreground"
                  >
                    {submission.user.name || tProfile("anonymous")}
                  </Link>
                </PageSubtitle>
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
              {isLoggedIn &&
                submission.critiquesEnabled &&
                (isOwner || submission.shareStatus === "PUBLIC") && (
                  <div className="mt-3 flex flex-wrap md:hidden">
                    <CritiqueButton
                      submissionId={submission.id}
                      critiquesEnabled={submission.critiquesEnabled}
                      isOwner={isOwner}
                      currentUserId={currentUserId}
                      submissionTitle={submission.title}
                      user={submission.user}
                    />
                  </div>
                )}
            </CreatorHubHeaderLayout>
          </div>
        </div>

        <SubmissionMobileMenu
          submission={{
            id: submission.id,
            title: submission.title,
            shareStatus: submission.shareStatus,
            critiquesEnabled: submission.critiquesEnabled,
            _count: { ...submission._count, comments: commentCount },
            user: submission.user,
          }}
          isOwner={isOwner}
          isLoggedIn={isLoggedIn}
          hasImage={hasImage}
          hasProgressionsGif={hasProgressionsGif}
          showComments={showComments}
          onOpenComments={() => setCommentsModalOpen(true)}
        />

        {isWip && (
          <div className="mb-6 w-full">
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

        <div className="w-full min-w-0">
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
        </div>
      </PageLayout>

      {hasImage && (
        <SubmissionLightbox
          submission={{
            id: submission.id,
            title: submission.title,
            imageUrl: submission.imageUrl,
            text: submission.text,
            shareStatus: submission.shareStatus ?? "PUBLIC",
            critiquesEnabled: submission.critiquesEnabled ?? false,
            commentsEnabled: submission.commentsEnabled ?? true,
            user: submission.user,
            _count: { ...submission._count, comments: commentCount },
          }}
          onClose={() => setIsLightboxOpen(false)}
          isOpen={isLightboxOpen}
          hideGoToSubmission={true}
          currentUserId={currentUserId}
          onOpenComments={() => {
            setIsLightboxOpen(false);
            setCommentsModalOpen(true);
          }}
        />
      )}

      {showComments && (
        <CommentViewerModal
          submission={{
            id: submission.id,
            title: submission.title,
            imageUrl: submission.imageUrl,
            user: {
              id: submission.user.id,
              name: submission.user.name,
              image: submission.user.image,
              profileImageUrl: submission.user.profileImageUrl ?? null,
              slug: submission.user.slug ?? null,
            },
            _count: { comments: commentCount },
          }}
          open={commentsModalOpen}
          onOpenChange={setCommentsModalOpen}
          onCommentCountChange={(_id, newCount) => setCommentCount(newCount)}
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
