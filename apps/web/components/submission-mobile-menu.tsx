"use client";

import Link from "@/components/link";
import { MessageCircle, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { ShareButton } from "@/components/share-button";
import { Button, buttonVariants } from "@createspot/ui-primitives/button";
import { cn, getCreatorUrl } from "@/lib/utils";
import { CollectionDownloadDropdown } from "@/components/collection-download-dropdown";
import { FavoriteButton } from "@/components/favorite-button";

interface SubmissionMobileMenuProps {
  submission: {
    id: string;
    title: string | null;
    shareStatus?: "PRIVATE" | "PROFILE" | "PUBLIC";
    critiquesEnabled?: boolean;
    _count: { favorites: number; comments: number };
    user: {
      id: string;
      slug?: string | null;
      name?: string | null;
      instagram?: string | null;
      twitter?: string | null;
      linkedin?: string | null;
      website?: string | null;
    };
  };
  isOwner: boolean;
  isLoggedIn: boolean;
  hasImage: boolean;
  hasProgressionsGif: boolean;
  showComments?: boolean;
  onOpenComments?: () => void;
}

export function SubmissionMobileMenu({
  submission,
  isOwner,
  isLoggedIn,
  hasImage,
  hasProgressionsGif,
  showComments = false,
  onOpenComments,
}: SubmissionMobileMenuProps) {
  const tSubmission = useTranslations("submission");
  const tFeed = useTranslations("feed");

  return (
    <div
      className="fixed right-4 z-40 flex flex-col items-center gap-2.5 md:hidden"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)" }}
    >
      {isOwner && (
        <Button
          variant="fabMuted"
          asChild
          aria-label={tSubmission("edit")}
          title={tSubmission("edit")}
        >
          <Link
            href={`${getCreatorUrl(submission.user)}/s/${submission.id}/edit`}
          >
            <Pencil className="h-5 w-5" />
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
          compactTrigger
        />
      )}
      {isLoggedIn && (
        <FavoriteButton
          submissionId={submission.id}
          size="md"
          count={submission._count.favorites}
          inlineCount
          className={cn("relative", buttonVariants({ variant: "fabMuted" }))}
        />
      )}
      {showComments && onOpenComments && (
        <Button
          type="button"
          variant="fabMuted"
          onClick={onOpenComments}
          aria-label={tFeed("commentsCount", {
            count: submission._count.comments,
          })}
          className={cn(
            submission._count.comments > 0 && "!gap-0.5 px-0",
          )}
        >
          <MessageCircle
            className={cn(
              "shrink-0",
              submission._count.comments > 0 ? "h-4 w-4" : "h-5 w-5",
            )}
          />
          {submission._count.comments > 0 && (
            <span className="text-[11px] font-medium tabular-nums leading-none">
              {submission._count.comments}
            </span>
          )}
        </Button>
      )}
      <ShareButton
        type="submission"
        submissionId={submission.id}
        userId={submission.user.id}
        userSlug={submission.user.slug}
        className={buttonVariants({ variant: "fabFilled" })}
      />
    </div>
  );
}
