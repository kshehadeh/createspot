"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/share-button";
import { CollectionDownloadDropdown } from "@/components/collection-download-dropdown";
import { FavoriteButton } from "@/components/favorite-button";
import { CritiqueButton } from "@/components/critique-button";
import { MobileTitleDropdown } from "@/components/mobile-title-dropdown";
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
  const [isOpen, setIsOpen] = useState(false);
  const tExhibition = useTranslations("exhibition");
  const tSubmission = useTranslations("submission");

  const titleContent = (
    <span className="break-words">
      {submission.title || tExhibition("untitled")}
    </span>
  );

  return (
    <MobileTitleDropdown
      open={isOpen}
      onOpenChange={setIsOpen}
      title={titleContent}
    >
      <div className="flex flex-wrap items-center gap-2">
        {isOwner && (
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link
              href={`${getCreatorUrl(submission.user)}/s/${submission.id}/edit`}
              onClick={() => setIsOpen(false)}
            >
              <Pencil className="h-4 w-4" />
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
        <ShareButton
          type="submission"
          submissionId={submission.id}
          userId={submission.user.id}
          userSlug={submission.user.slug}
        />
      </div>
    </MobileTitleDropdown>
  );
}
