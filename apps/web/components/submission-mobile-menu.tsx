"use client";

import Link from "@/components/link";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { ShareButton } from "@/components/share-button";
import { Button, buttonVariants } from "@createspot/ui-primitives/button";
import { cn } from "@/lib/utils";
import { CollectionDownloadDropdown } from "@/components/collection-download-dropdown";
import { FavoriteButton } from "@/components/favorite-button";
import { CritiqueButton } from "@/components/critique-button";
import { getCreatorUrl } from "@/lib/utils";

interface SubmissionMobileMenuProps {
  submission: {
    id: string;
    title: string | null;
    shareStatus?: "PRIVATE" | "PROFILE" | "PUBLIC";
    critiquesEnabled?: boolean;
    _count: { favorites: number };
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
  currentUserId?: string | null;
  hasImage: boolean;
  hasProgressionsGif: boolean;
}

export function SubmissionMobileMenu({
  submission,
  isOwner,
  isLoggedIn,
  currentUserId,
  hasImage,
  hasProgressionsGif,
}: SubmissionMobileMenuProps) {
  const tExhibition = useTranslations("exhibition");
  const tSubmission = useTranslations("submission");

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="break-words text-2xl leading-tight font-bold text-foreground">
          {submission.title || tExhibition("untitled")}
        </h1>
        {isLoggedIn &&
          submission.critiquesEnabled &&
          (isOwner || submission.shareStatus === "PUBLIC") && (
            <div className="flex flex-wrap items-center gap-2">
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
      </div>

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
            className={cn("relative", buttonVariants({ variant: "fabMuted" }))}
          />
        )}
        <ShareButton
          type="submission"
          submissionId={submission.id}
          userId={submission.user.id}
          userSlug={submission.user.slug}
          className={buttonVariants({ variant: "fabFilled" })}
        />
      </div>
    </>
  );
}
