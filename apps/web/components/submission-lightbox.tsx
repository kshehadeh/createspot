"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { fetcher } from "@/lib/swr";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Heart, X, FileText, Edit, Eye, MessageSquare } from "lucide-react";
import { ShareButton } from "@/components/share-button";
import { useSession } from "next-auth/react";
import { useTrackSubmissionView } from "@/lib/hooks/use-track-submission-view";
import { buildRoutePath } from "@/lib/routes";
import {
  BaseLightbox,
  BaseLightboxNavigation,
  BaseLightboxRenderContext,
  LIGHTBOX_BUTTON_CLASS,
} from "@/components/base-lightbox";

interface LightboxSubmission {
  id: string;
  title: string | null;
  imageUrl: string | null;
  text: string | null;
  shareStatus: "PRIVATE" | "PROFILE" | "PUBLIC";
  critiquesEnabled: boolean;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
    slug?: string | null;
  };
  _count?: {
    favorites: number;
  };
}

export interface SubmissionLightboxOptions {
  /** Hide the "Go To Submission" button (e.g., when already on the submission page). Default: false */
  hideGoToSubmission?: boolean;
  /** Whether to enable download protection. Default: true */
  protectionEnabled?: boolean;
}

export interface SubmissionLightboxNavigation {
  onGoToPrevious: () => void;
  onGoToNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  /** Optional image URL for the next submission; when provided, preloaded for instant display on navigate. */
  nextImageUrl?: string | null;
  /** Optional image URL for the previous submission; when provided, preloaded for instant display on navigate. */
  prevImageUrl?: string | null;
}

interface SubmissionLightboxProps {
  submission: LightboxSubmission;
  word: string;
  onClose: () => void;
  isOpen: boolean;
  /** Current logged-in user ID. If provided, edit button will show for owned submissions. */
  currentUserId?: string | null;
  /** Visibility and behavior options. Prefer this over flat boolean props. */
  options?: SubmissionLightboxOptions;
  /** When provided, enables prev/next submission navigation (e.g. from a gallery). Prefer this over flat navigation props. */
  navigation?: SubmissionLightboxNavigation;
  /** @deprecated Use options.hideGoToSubmission */
  hideGoToSubmission?: boolean;
  /** @deprecated Use options.protectionEnabled */
  protectionEnabled?: boolean;
  /** @deprecated Use navigation.onGoToPrevious */
  onGoToPrevious?: () => void;
  /** @deprecated Use navigation.onGoToNext */
  onGoToNext?: () => void;
  /** @deprecated Use navigation.hasPrevious */
  hasPrevious?: boolean;
  /** @deprecated Use navigation.hasNext */
  hasNext?: boolean;
}

export function SubmissionLightbox({
  submission,
  onClose,
  isOpen,
  currentUserId: propCurrentUserId,
  options,
  navigation,
  hideGoToSubmission: hideGoToSubmissionProp,
  protectionEnabled: protectionEnabledProp,
  onGoToPrevious: onGoToPreviousProp,
  onGoToNext: onGoToNextProp,
  hasPrevious: hasPreviousProp,
  hasNext: hasNextProp,
}: SubmissionLightboxProps) {
  const _hideGoToSubmission =
    options?.hideGoToSubmission ?? hideGoToSubmissionProp ?? false;
  const protectionEnabled =
    options?.protectionEnabled ?? protectionEnabledProp ?? true;
  const onGoToPrevious = navigation?.onGoToPrevious ?? onGoToPreviousProp;
  const onGoToNext = navigation?.onGoToNext ?? onGoToNextProp;
  const hasPrevious =
    navigation?.hasPrevious ?? hasPreviousProp ?? onGoToPrevious !== undefined;
  const hasNext =
    navigation?.hasNext ?? hasNextProp ?? onGoToNext !== undefined;

  const nextImageUrl = navigation?.nextImageUrl;
  const prevImageUrl = navigation?.prevImageUrl;

  const t = useTranslations("exhibition");
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || propCurrentUserId;
  const router = useRouter();
  const [closeTooltipOpen, setCloseTooltipOpen] = useState(false);
  const [closeTooltipHovered, setCloseTooltipHovered] = useState(false);

  const { data: submissionData } = useSWR<{
    submission: { userId: string; user?: { slug: string | null } };
  }>(
    isOpen && submission.id ? `/api/submissions/${submission.id}` : null,
    fetcher,
  );
  const submissionUserId =
    submissionData?.submission?.userId ?? submission.user?.id ?? null;
  const submissionUserSlug =
    submissionData?.submission?.user?.slug ?? submission.user?.slug ?? null;

  const hasImage = !!submission.imageUrl;
  const hasText = !!submission.text;
  const isOwner =
    !!currentUserId &&
    !!submission.user?.id &&
    currentUserId === submission.user.id;
  const isPrivate = submission.shareStatus === "PRIVATE";
  const showShare = !isPrivate;
  const showCritique =
    !isPrivate && submission.critiquesEnabled && !!currentUserId;

  const favoriteCount =
    submission._count?.favorites ?? (submission as any).favoriteCount ?? 0;

  // Get creator ID for route building
  const getCreatorId = useCallback((): string | null => {
    if (submission.user?.id) {
      return submission.user.slug || submission.user.id;
    }
    return submissionUserSlug || submissionUserId;
  }, [submission.user, submissionUserSlug, submissionUserId]);

  // Build submission URL using routes
  const getSubmissionUrl = useCallback((): string | null => {
    const creatorId = getCreatorId();
    if (!creatorId || !submission.id) return null;
    return buildRoutePath("submission", {
      creatorid: creatorId,
      submissionid: submission.id,
    });
  }, [getCreatorId, submission.id]);

  // Reset close button tooltip when lightbox opens
  useEffect(() => {
    if (isOpen) {
      setCloseTooltipOpen(false);
      setCloseTooltipHovered(false);
    }
  }, [isOpen]);

  // Control close button tooltip to only show on hover, not focus
  useEffect(() => {
    if (closeTooltipHovered) {
      const timer = setTimeout(() => setCloseTooltipOpen(true), 300);
      return () => clearTimeout(timer);
    } else {
      setCloseTooltipOpen(false);
    }
  }, [closeTooltipHovered]);

  // Track view when lightbox opens
  useTrackSubmissionView(submission.id, isOwner, isOpen);

  // Navigate to edit page
  const handleEditClick = useCallback(() => {
    const creatorId = getCreatorId();
    if (creatorId && submission.id) {
      router.push(
        buildRoutePath("submissionEdit", {
          creatorid: creatorId,
          submissionid: submission.id,
        }),
      );
    }
  }, [getCreatorId, submission.id, router]);

  // Convert to base lightbox navigation format
  const baseNavigation: BaseLightboxNavigation | undefined =
    onGoToPrevious && onGoToNext
      ? {
          onGoToPrevious,
          onGoToNext,
          hasPrevious,
          hasNext,
          nextImageUrl,
          prevImageUrl,
          prevLabel: t("previousSubmission"),
          nextLabel: t("nextSubmission"),
        }
      : undefined;

  // Render sidebar content
  const renderSidebar = useCallback(
    (_context: BaseLightboxRenderContext) => (
      <>
        {/* Title and creator */}
        <div className="flex-shrink-0 p-6 xl:p-8 pb-4">
          <h2 className="mb-2 text-2xl font-semibold text-muted-foreground">
            {submission.title || t("untitled")}
          </h2>
          {submission.user?.name && (
            <p className="text-sm text-muted-foreground/70 mb-2">
              {submission.user.name}
            </p>
          )}
          {favoriteCount > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground/70">
              <Heart className="h-4 w-4 fill-red-400 text-red-400" />
              <span className="text-sm">{favoriteCount}</span>
            </div>
          )}
        </div>

        {/* Text content */}
        {hasText && (
          <div className="flex-1 overflow-y-auto px-6 xl:px-8 pb-6 xl:pb-8">
            <div
              className="prose prose-lg prose-invert max-w-none text-muted-foreground prose-headings:text-muted-foreground prose-p:text-muted-foreground prose-strong:text-muted-foreground prose-em:text-muted-foreground prose-a:text-muted-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-li:text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: submission.text! }}
            />
          </div>
        )}
      </>
    ),
    [
      submission.title,
      submission.user?.name,
      submission.text,
      favoriteCount,
      hasText,
      t,
    ],
  );

  // Render metadata overlay (mobile)
  const renderMetadataOverlay = useCallback(
    () => (
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="text-white font-medium text-sm sm:text-base">
          {submission.title || "Untitled"}
        </span>
        {submission.user && (
          <span className="text-zinc-300 text-xs sm:text-sm">
            {submission.user.name || "Anonymous"}
          </span>
        )}
        {favoriteCount > 0 && (
          <div className="flex items-center gap-1.5 text-white">
            <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-red-400 text-red-400" />
            <span className="text-xs sm:text-sm">{favoriteCount}</span>
          </div>
        )}
      </div>
    ),
    [submission.title, submission.user, favoriteCount],
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
                aria-label="View text"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View text</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* View button */}
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                asChild
                className={`hidden xl:flex ${LIGHTBOX_BUTTON_CLASS}`}
              >
                <Link
                  href={getSubmissionUrl() || "#"}
                  onClick={(e) => {
                    e.stopPropagation();
                    const url = getSubmissionUrl();
                    if (!url && submissionUserId && submission.id) {
                      e.preventDefault();
                      router.push(
                        buildRoutePath("submission", {
                          creatorid: submissionUserId,
                          submissionid: submission.id,
                        }),
                      );
                    }
                  }}
                >
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View full submission page</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                asChild
                className={`xl:hidden ${LIGHTBOX_BUTTON_CLASS}`}
                aria-label="View submission"
              >
                <Link
                  href={getSubmissionUrl() || "#"}
                  onClick={(e) => {
                    e.stopPropagation();
                    const url = getSubmissionUrl();
                    if (!url && submissionUserId && submission.id) {
                      e.preventDefault();
                      router.push(
                        buildRoutePath("submission", {
                          creatorid: submissionUserId,
                          submissionid: submission.id,
                        }),
                      );
                    }
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View submission</p>
            </TooltipContent>
          </Tooltip>
        </>

        {/* Edit button - shown if user owns the submission */}
        {isOwner && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick();
                  }}
                  className={`hidden xl:flex ${LIGHTBOX_BUTTON_CLASS}`}
                  aria-label="Edit submission"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit submission</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick();
                  }}
                  className={`xl:hidden ${LIGHTBOX_BUTTON_CLASS}`}
                  aria-label="Edit submission"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit submission</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {/* Critique button */}
        {showCritique &&
          (() => {
            const critiqueHref =
              getCreatorId() && submission.id
                ? buildRoutePath("submissionCritiques", {
                    creatorid: getCreatorId()!,
                    submissionid: submission.id,
                  })
                : "#";
            return (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className={`hidden xl:flex ${LIGHTBOX_BUTTON_CLASS}`}
                      aria-label="Critique"
                    >
                      <Link
                        href={critiqueHref}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Critique</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Critique</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      asChild
                      className={`xl:hidden ${LIGHTBOX_BUTTON_CLASS}`}
                      aria-label="Critique"
                    >
                      <Link
                        href={critiqueHref}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Critique</p>
                  </TooltipContent>
                </Tooltip>
              </>
            );
          })()}

        {/* Share button */}
        {showShare && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <ShareButton
                  type="submission"
                  submissionId={submission.id}
                  userId={submissionUserId ?? undefined}
                  userSlug={submissionUserSlug ?? undefined}
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center p-0 [&_svg]:size-4 ${LIGHTBOX_BUTTON_CLASS} border`}
                  ariaLabel={t("shareSubmission")}
                />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share submission</p>
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
              onMouseEnter={() => setCloseTooltipHovered(true)}
              onMouseLeave={() => setCloseTooltipHovered(false)}
              className={LIGHTBOX_BUTTON_CLASS}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Close lightbox</p>
          </TooltipContent>
        </Tooltip>
      </>
    ),
    [
      hasText,
      hasImage,
      isOwner,
      showCritique,
      showShare,
      submission.id,
      submissionUserId,
      submissionUserSlug,
      getSubmissionUrl,
      getCreatorId,
      handleEditClick,
      onClose,
      closeTooltipOpen,
      router,
      t,
    ],
  );

  // Render text overlay content
  const renderTextOverlay = useCallback(
    () => (
      <>
        {submission.title && (
          <h2 className="mb-4 text-2xl font-semibold text-white">
            {submission.title}
          </h2>
        )}
        <div
          className="prose prose-lg prose-invert max-w-none text-white"
          dangerouslySetInnerHTML={{ __html: submission.text! }}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {}}
          className="absolute right-4 top-4"
          aria-label="Close text overlay"
        >
          <X className="h-6 w-6" />
        </Button>
      </>
    ),
    [submission.title, submission.text],
  );

  return (
    <BaseLightbox
      item={{
        id: submission.id,
        imageUrl: submission.imageUrl,
        text: submission.text,
        title: submission.title,
      }}
      isOpen={isOpen}
      onClose={onClose}
      dialogTitle={`${submission.title || "Submission"} ${submission.user?.name ? `by ${submission.user.name}` : ""}`}
      protectionEnabled={protectionEnabled}
      navigation={baseNavigation}
      renderControls={renderControls}
      renderSidebar={hasImage ? renderSidebar : undefined}
      renderMetadataOverlay={renderMetadataOverlay}
      renderTextOverlay={hasText ? renderTextOverlay : undefined}
    />
  );
}
