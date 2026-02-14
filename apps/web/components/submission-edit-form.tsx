"use client";

import { useRouter } from "next/navigation";
import { PortfolioItemForm } from "@/components/portfolio-item-form";
import { HintPopover } from "@/components/hint-popover";
import { usePageHints } from "@/lib/hooks/use-page-hints";

interface SubmissionData {
  id: string;
  title: string | null;
  imageUrl: string | null;
  imageFocalPoint?: { x: number; y: number } | null;
  referenceImageUrl?: string | null;
  text: string | null;
  tags: string[];
  category: string | null;
  shareStatus?: "PRIVATE" | "PROFILE" | "PUBLIC";
  critiquesEnabled?: boolean;
  progressions?: Array<{
    id: string;
    imageUrl: string | null;
    text: string | null;
    comment: string | null;
    order: number;
  }>;
}

interface SubmissionEditFormProps {
  submissionId: string;
  initialData: SubmissionData;
  tutorialData?: any;
}

export function SubmissionEditForm({
  submissionId,
  initialData,
  tutorialData,
}: SubmissionEditFormProps) {
  const router = useRouter();
  const nextHint = usePageHints({
    tutorialData: tutorialData ?? null,
    page: "submission-edit",
  });

  const handleSuccess = async () => {
    // Get the submission to find the creator ID
    const response = await fetch(`/api/submissions/${submissionId}`);
    if (response.ok) {
      const data = await response.json();
      const creatorId = data.submission.userId;
      // Navigate back to the submission page and refresh
      router.push(`/creators/${creatorId}/s/${submissionId}`);
      router.refresh();
    }
    // Note: If API fails, we can't navigate - this shouldn't happen
  };

  const handleCancel = async () => {
    // Get the submission to find the creator ID
    const response = await fetch(`/api/submissions/${submissionId}`);
    if (response.ok) {
      const data = await response.json();
      const creatorId = data.submission.userId;
      // Navigate back to the submission page
      router.push(`/creators/${creatorId}/s/${submissionId}`);
    }
    // Note: If API fails, we can't navigate - this shouldn't happen
  };

  return (
    <>
      <PortfolioItemForm
        mode="edit"
        initialData={initialData}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
      {nextHint && (
        <HintPopover
          hintKey={nextHint.key}
          page="submission-edit"
          title={nextHint.title}
          description={nextHint.description}
          targetSelector={nextHint.targetSelector}
          side={nextHint.side}
          shouldShow={true}
          order={nextHint.order}
          showArrow={nextHint.showArrow ?? true}
          fixedPosition={nextHint.fixedPosition}
        />
      )}
    </>
  );
}
