"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { TextThumbnail } from "@/components/text-thumbnail";
import { SubmissionEditModal } from "@/components/submission-edit-modal";
import { Button } from "@/components/ui/button";
import { getObjectPositionStyle } from "@/lib/image-utils";

export interface PortfolioAddWorkSubmissionOption {
  id: string;
  title: string | null;
  imageUrl: string | null;
  imageFocalPoint?: { x: number; y: number } | null;
  text: string | null;
  isPortfolio: boolean;
  tags: string[];
  category: string | null;
  shareStatus?: "PRIVATE" | "PROFILE" | "PUBLIC";
}

interface PortfolioAddWorkSectionProps {
  submissions: PortfolioAddWorkSubmissionOption[];
}

export function PortfolioAddWorkSection({
  submissions,
}: PortfolioAddWorkSectionProps) {
  const t = useTranslations("portfolio");
  const tProfile = useTranslations("profile");
  const [addingToPortfolio, setAddingToPortfolio] =
    useState<PortfolioAddWorkSubmissionOption | null>(null);
  const [creatingPortfolioItem, setCreatingPortfolioItem] = useState(false);

  const getSubmissionLabel = (submission: PortfolioAddWorkSubmissionOption) =>
    submission.category || tProfile("portfolio");

  const notOnPortfolio = submissions.filter((s) => !s.isPortfolio);

  return (
    <div className="mt-10 space-y-6">
      <Button
        type="button"
        variant="outline"
        onClick={() => setCreatingPortfolioItem(true)}
        className="w-full border-2 border-dashed py-8"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        {t("addNewItem")}
      </Button>

      {notOnPortfolio.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-medium text-foreground">
            {t("addPromptSubmissions")}
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">
            {t("addPromptSubmissionsDescription")}
          </p>
          <div className="space-y-2">
            {notOnPortfolio.slice(0, 5).map((submission) => {
              const word = getSubmissionLabel(submission);
              return (
                <div
                  key={submission.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  {submission.imageUrl ? (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={submission.imageUrl}
                        alt={submission.title || word}
                        fill
                        className="object-cover"
                        sizes="40px"
                        style={{
                          objectPosition: getObjectPositionStyle(
                            submission.imageFocalPoint,
                          ),
                        }}
                      />
                    </div>
                  ) : submission.text ? (
                    <TextThumbnail
                      text={submission.text}
                      className="h-10 w-10 shrink-0 rounded-lg"
                    />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {submission.title || word}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {word}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setAddingToPortfolio(submission)}
                    className="shrink-0"
                  >
                    {t("addToPortfolio")}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {creatingPortfolioItem && (
        <SubmissionEditModal
          isOpen={true}
          onClose={() => setCreatingPortfolioItem(false)}
          mode="create"
          onSuccess={() => setCreatingPortfolioItem(false)}
        />
      )}

      {addingToPortfolio && (
        <SubmissionEditModal
          isOpen={true}
          onClose={() => setAddingToPortfolio(null)}
          mode="add-to-portfolio"
          initialData={{
            id: addingToPortfolio.id,
            title: addingToPortfolio.title,
            imageUrl: addingToPortfolio.imageUrl,
            imageFocalPoint: addingToPortfolio.imageFocalPoint,
            text: addingToPortfolio.text,
            tags: addingToPortfolio.tags,
            category: addingToPortfolio.category,
            shareStatus: addingToPortfolio.shareStatus || "PUBLIC",
          }}
          onSuccess={() => setAddingToPortfolio(null)}
        />
      )}
    </div>
  );
}
