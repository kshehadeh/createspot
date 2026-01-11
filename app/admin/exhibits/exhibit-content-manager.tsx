"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SubmissionBrowser } from "./submission-browser";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { Button } from "@/components/ui/button";

interface Submission {
  id: string;
  title: string | null;
  imageUrl: string | null;
  text: string | null;
  category: string | null;
  tags: string[];
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  prompt: {
    word1: string;
    word2: string;
    word3: string;
  } | null;
  wordIndex: number | null;
}

interface ExhibitContentManagerProps {
  exhibitId: string;
  initialSubmissions: Submission[];
}

export function ExhibitContentManager({
  exhibitId,
  initialSubmissions,
}: ExhibitContentManagerProps) {
  const router = useRouter();
  const t = useTranslations("admin.exhibits");
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);

  useEffect(() => {
    setSubmissions(initialSubmissions);
  }, [initialSubmissions]);

  const handleAddSubmissions = async (submissionIds: string[]) => {
    try {
      const response = await fetch(`/api/exhibits/${exhibitId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionIds }),
      });

      if (!response.ok) {
        throw new Error(t("addError"));
      }

      router.refresh();
    } catch {
      // Handle error
    }
  };

  const handleRemoveSubmission = async (item: {
    id: string;
    title: string | null;
  }) => {
    try {
      const response = await fetch(
        `/api/exhibits/${exhibitId}/submissions?submissionId=${item.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error(t("removeError"));
      }

      router.refresh();
    } catch {
      // Handle error
    }
  };

  const handleReorder = async (items: Array<{ id: string }>) => {
    try {
      const response = await fetch(`/api/exhibits/${exhibitId}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionIds: items.map((item) => item.id),
        }),
      });

      if (!response.ok) {
        throw new Error(t("reorderError"));
      }

      router.refresh();
    } catch {
      throw new Error(t("reorderError"));
    }
  };

  // Transform submissions to PortfolioItem format
  const portfolioItems = submissions.map((submission) => ({
    id: submission.id,
    title: submission.title,
    imageUrl: submission.imageUrl,
    text: submission.text,
    isPortfolio: false,
    portfolioOrder: null,
    tags: submission.tags,
    category: submission.category,
    promptId: null,
    wordIndex: submission.wordIndex,
    prompt: submission.prompt,
    _count: {
      favorites: 0,
    },
    user: submission.user,
  }));

  const excludeIds = submissions.map((s) => s.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("exhibitContent")}</h3>
        <Button onClick={() => setIsBrowserOpen(true)}>
          {t("addSubmissions")}
        </Button>
      </div>

      <PortfolioGrid
        items={portfolioItems}
        isLoggedIn={true}
        isOwnProfile={false}
        showPromptBadge={true}
        allowEdit={true}
        mode="exhibit"
        onRemove={handleRemoveSubmission}
        onReorder={handleReorder}
      />

      <SubmissionBrowser
        isOpen={isBrowserOpen}
        onClose={() => setIsBrowserOpen(false)}
        onSelect={handleAddSubmissions}
        excludeIds={excludeIds}
      />
    </div>
  );
}
