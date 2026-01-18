"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useTrackSubmissionView } from "@/lib/hooks/use-track-submission-view";
import { ExpandableText } from "@/components/expandable-text";
import { SubmissionImage } from "@/components/submission-image";
import { ShareButton } from "@/components/share-button";
import { FavoriteButton } from "@/components/favorite-button";
import { CritiqueButton } from "@/components/critique-button";
import { FavoritesProvider } from "@/components/favorites-provider";
import { SubmissionLightbox } from "@/components/submission-lightbox";
import { SubmissionEditModal } from "@/components/submission-edit-modal";
import { SocialLinks } from "@/app/profile/[userId]/social-links";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    user: {
      id: string;
      name: string | null;
      image: string | null;
      bio: string | null;
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
  };
  isLoggedIn: boolean;
  isOwner?: boolean;
  currentUserId?: string | null;
}

export function SubmissionDetail({
  submission: initialSubmission,
  isLoggedIn,
  isOwner = false,
  currentUserId,
}: SubmissionDetailProps) {
  const tCategories = useTranslations("categories");
  const tExhibition = useTranslations("exhibition");
  const tSubmission = useTranslations("submission");
  const tProfile = useTranslations("profile");
  const [mobileView, setMobileView] = useState<"image" | "text">("image");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Local state for submission data that can be updated after editing
  const [submission, setSubmission] = useState(initialSubmission);

  // Track view when component mounts (only if not the owner)
  useTrackSubmissionView(submission.id, isOwner);

  const hasImage = !!submission.imageUrl;
  const hasText = !!submission.text;
  const hasBoth = hasImage && hasText;

  const getWord = (): string => {
    if (!submission.prompt || !submission.wordIndex) return "";
    const words = [
      submission.prompt.word1,
      submission.prompt.word2,
      submission.prompt.word3,
    ];
    return words[submission.wordIndex - 1];
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
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Title and user name */}
              <div className="flex flex-col gap-1">
                <h1 className="text-xl font-bold leading-[1.3] text-foreground sm:text-2xl">
                  {submission.title || tExhibition("untitled")}
                  {submission.category && (
                    <span className="ml-2 text-base font-normal text-muted-foreground sm:text-lg">
                      ({tCategories(submission.category)})
                    </span>
                  )}
                </h1>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/profile/${submission.user.id}`}
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

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3">
                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                    className="gap-1.5"
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
                  </Button>
                )}
                <ShareButton
                  submissionId={submission.id}
                  title={submission.title}
                />
                {isLoggedIn && (
                  <FavoriteButton submissionId={submission.id} size="md" />
                )}
                {isLoggedIn && submission.critiquesEnabled && (
                  <CritiqueButton
                    submissionId={submission.id}
                    critiquesEnabled={submission.critiquesEnabled}
                    isOwner={isOwner}
                    currentUserId={currentUserId}
                    submissionTitle={submission.title}
                  />
                )}
                {submission._count.favorites > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <svg
                      className="h-5 w-5 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span>{submission._count.favorites}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Main content */}
        <main className="mx-auto max-w-7xl px-6 py-6">
          {/* Mobile tabs */}
          {hasBoth && (
            <div className="mb-6 flex gap-2 md:hidden">
              <button
                onClick={() => setMobileView("image")}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  mobileView === "image"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {tSubmission("image")}
              </button>
              <button
                onClick={() => setMobileView("text")}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  mobileView === "text"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {tSubmission("text")}
              </button>
            </div>
          )}

          {/* Content layout */}
          <div
            className={`mb-12 ${hasBoth ? "md:grid md:grid-cols-3 md:gap-8" : ""}`}
          >
            {/* Image section */}
            {hasImage && (
              <div
                className={`mb-8 ${hasBoth ? "md:col-span-2 md:mb-0 md:sticky md:top-6" : ""} ${
                  hasBoth && mobileView === "text" ? "hidden md:block" : ""
                }`}
              >
                <SubmissionImage
                  imageUrl={submission.imageUrl!}
                  alt={submission.title || tSubmission("submissionAlt")}
                  imageFocalPoint={submission.imageFocalPoint}
                  tags={submission.tags}
                  onExpand={() => setIsLightboxOpen(true)}
                />
              </div>
            )}

            {/* Text section */}
            {hasText && (
              <div
                className={`${hasBoth ? "md:col-span-1" : "mx-auto max-w-3xl"} ${
                  hasBoth && mobileView === "image" ? "hidden md:block" : ""
                }`}
              >
                <Card className="rounded-xl">
                  <CardContent className="p-6">
                    {submission.title && (
                      <h1 className="mb-4 text-2xl font-semibold text-foreground">
                        {submission.title}
                      </h1>
                    )}
                    <ExpandableText
                      text={submission.text!}
                      title={submission.title}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      {hasImage && (
        <SubmissionLightbox
          submission={{
            id: submission.id,
            title: submission.title,
            imageUrl: submission.imageUrl,
            text: submission.text,
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

      {isOwner && (
        <SubmissionEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialData={{
            id: submission.id,
            title: submission.title,
            imageUrl: submission.imageUrl,
            imageFocalPoint: submission.imageFocalPoint,
            text: submission.text,
            tags: submission.tags,
            category: submission.category,
            shareStatus: submission.shareStatus,
            critiquesEnabled: submission.critiquesEnabled,
          }}
          onSuccess={(updatedData) => {
            // Update the local submission state with the new data
            if (updatedData) {
              setSubmission((prev) => ({
                ...prev,
                title: updatedData.title,
                imageUrl: updatedData.imageUrl,
                imageFocalPoint: updatedData.imageFocalPoint,
                text: updatedData.text,
                tags: updatedData.tags,
                category: updatedData.category,
                shareStatus: updatedData.shareStatus,
                critiquesEnabled: updatedData.critiquesEnabled,
              }));
            }
          }}
        />
      )}
    </FavoritesProvider>
  );
}
