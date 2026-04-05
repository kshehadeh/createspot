"use client";

import { useState, useEffect } from "react";
import Link from "@/components/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCreatorUrl } from "@/lib/utils";

interface CritiqueButtonProps {
  submissionId: string;
  critiquesEnabled: boolean;
  isOwner: boolean;
  currentUserId?: string | null;
  submissionTitle?: string | null;
  /** User (creator) for building critiques page URL. Required for link. */
  user: { id: string; slug?: string | null };
  /** Outline icon button (e.g. desktop submission header toolbar). */
  toolbarIcon?: boolean;
}

export function CritiqueButton({
  submissionId,
  critiquesEnabled,
  isOwner,
  currentUserId,
  user,
  toolbarIcon = false,
}: CritiqueButtonProps) {
  const t = useTranslations("critique");
  const [unseenCount, setUnseenCount] = useState(0);

  const critiquesHref = `${getCreatorUrl(user)}/s/${submissionId}/critiques`;

  useEffect(() => {
    if (isOwner && critiquesEnabled && currentUserId) {
      const fetchUnseenCount = async () => {
        try {
          const response = await fetch(
            `/api/submissions/${submissionId}/critiques`,
          );
          if (response.ok) {
            const data = await response.json();
            const unseen = data.critiques.filter(
              (c: { seenAt: string | null }) => c.seenAt === null,
            ).length;
            setUnseenCount(unseen);
          }
        } catch (error) {
          console.error("Failed to fetch unseen critiques:", error);
        }
      };
      fetchUnseenCount();
    }
  }, [submissionId, isOwner, critiquesEnabled, currentUserId]);

  if (!critiquesEnabled) {
    return null;
  }

  const icon = (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );

  if (toolbarIcon) {
    return (
      <Button
        variant="outline"
        size="icon"
        asChild
        className="relative h-10 w-10 shrink-0"
        data-hint-target="critique-button"
      >
        <Link
          href={critiquesHref}
          aria-label={t("critiqueButton")}
          title={t("critiqueButton")}
        >
          {icon}
          {isOwner && unseenCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center px-1 py-0 text-[10px] leading-none"
            >
              {unseenCount > 99 ? "99+" : unseenCount}
            </Badge>
          )}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      asChild
      className="gap-1.5"
      data-hint-target="critique-button"
    >
      <Link href={critiquesHref}>
        {icon}
        {t("critiqueButton")}
        {isOwner && unseenCount > 0 && (
          <Badge variant="destructive" className="ml-1">
            {unseenCount}
          </Badge>
        )}
      </Link>
    </Button>
  );
}
