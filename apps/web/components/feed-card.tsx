"use client";

import { useCallback } from "react";
import Link from "@/components/link";
import { useTranslations } from "next-intl";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@createspot/ui-primitives/avatar";
import { Button } from "@createspot/ui-primitives/button";
import { SubmissionMediaCarousel } from "@/components/submission-media-carousel";
import { FavoriteButton } from "@/components/favorite-button";
import { ShareButton } from "@/components/share-button";
import type { SubmissionMediaInput } from "@/lib/submission-slides";
import { getCreatorUrl } from "@/lib/utils";

export interface FeedCardSubmission extends SubmissionMediaInput {
  id: string;
  category: string | null;
  tags: string[];
  critiquesEnabled: boolean;
  createdAt: Date | string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    profileImageUrl: string | null;
    slug: string | null;
  };
  _count: {
    favorites: number;
  };
}

interface FeedCardProps {
  submission: FeedCardSubmission;
  isLoggedIn: boolean;
  currentUserId?: string | null;
  priority?: boolean;
  /** When set, tapping an image slide opens the submission lightbox (short tap; drags the carousel). */
  onOpenLightbox?: (submissionId: string) => void;
}

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString();
}

export function FeedCard({
  submission,
  isLoggedIn,
  currentUserId: _currentUserId,
  priority = false,
  onOpenLightbox,
}: FeedCardProps) {
  const t = useTranslations("feed");
  const tCategories = useTranslations("categories");

  const handleOpenLightbox = useCallback(
    (id: string) => {
      onOpenLightbox?.(id);
    },
    [onOpenLightbox],
  );

  const creatorUrl = getCreatorUrl(submission.user);
  const submissionUrl = `${creatorUrl}/s/${submission.id}`;

  const userInitials = submission.user.name
    ? submission.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const categorySubtitle =
    submission.category != null && submission.category !== ""
      ? tCategories(submission.category as never)
      : null;

  const mediaInput: SubmissionMediaInput = {
    title: submission.title,
    imageUrl: submission.imageUrl,
    imageFocalPoint: submission.imageFocalPoint,
    text: submission.text,
    referenceImageUrl: submission.referenceImageUrl,
    progressions: submission.progressions,
  };

  return (
    <article className="border-b border-border last:border-b-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={creatorUrl} className="shrink-0">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={
                submission.user.profileImageUrl ||
                submission.user.image ||
                undefined
              }
              alt={submission.user.name || ""}
            />
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={creatorUrl}
            className="text-sm font-semibold text-foreground hover:underline truncate block"
          >
            {submission.user.name || t("anonymous")}
          </Link>
          {categorySubtitle && (
            <span className="text-xs text-muted-foreground">
              {categorySubtitle}
            </span>
          )}
        </div>
        <time
          dateTime={new Date(submission.createdAt).toISOString()}
          className="shrink-0 text-xs text-muted-foreground [font-variant-numeric:tabular-nums]"
        >
          {formatRelativeTime(submission.createdAt)}
        </time>
      </div>

      <SubmissionMediaCarousel
        submission={mediaInput}
        submissionId={submission.id}
        variant="feed"
        priority={priority}
        onOpenLightbox={onOpenLightbox ? handleOpenLightbox : undefined}
      />

      {/* Interaction bar */}
      <div className="flex items-center gap-2.5 px-4 py-2">
        {isLoggedIn && (
          <FavoriteButton
            submissionId={submission.id}
            size="sm"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-foreground transition-colors hover:bg-muted hover:text-foreground"
          />
        )}
        <ShareButton
          type="submission"
          submissionId={submission.id}
          userId={submission.user.id}
          userSlug={submission.user.slug}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent p-0 text-foreground transition-colors hover:bg-muted hover:text-foreground"
        />
        {submission.critiquesEnabled && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-foreground hover:bg-muted hover:text-foreground"
            asChild
            aria-label={t("critiques")}
          >
            <Link href={`${submissionUrl}/critiques`}>
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </Link>
          </Button>
        )}
        <Link
          href={submissionUrl}
          className="ml-auto rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {t("viewSubmission")}
        </Link>
      </div>

      {/* Favorite count + caption */}
      <div className="px-4 pb-4">
        {submission._count.favorites > 0 && (
          <p className="mb-1 text-sm font-semibold text-foreground">
            {t("favorites", { count: submission._count.favorites })}
          </p>
        )}
        {submission.title && (
          <p className="text-sm text-foreground">
            <Link
              href={creatorUrl}
              className="font-semibold mr-1 hover:underline"
            >
              {submission.user.name || t("anonymous")}
            </Link>
            {submission.title}
          </p>
        )}
        {submission.tags.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {submission.tags.map((tag) => `#${tag}`).join(" ")}
          </p>
        )}
      </div>
    </article>
  );
}
