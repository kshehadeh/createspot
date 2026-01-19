"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CritiqueManagerModal } from "@/components/critique-manager-modal";

interface CritiqueButtonProps {
  submissionId: string;
  critiquesEnabled: boolean;
  isOwner: boolean;
  currentUserId?: string | null;
  submissionTitle?: string | null;
}

export function CritiqueButton({
  submissionId,
  critiquesEnabled,
  isOwner,
  currentUserId,
  submissionTitle,
}: CritiqueButtonProps) {
  const t = useTranslations("critique");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);

  // Fetch unseen count for creators
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

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="gap-1.5"
        data-hint-target="critique-button"
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
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {t("critiqueButton")}
        {isOwner && unseenCount > 0 && (
          <Badge variant="destructive" className="ml-1">
            {unseenCount}
          </Badge>
        )}
      </Button>
      <CritiqueManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        submissionId={submissionId}
        isOwner={isOwner}
        currentUserId={currentUserId}
        submissionTitle={submissionTitle}
        onUnseenCountChange={setUnseenCount}
      />
    </>
  );
}
