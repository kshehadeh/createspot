"use client";

import { useRouter } from "next/navigation";
import { PortfolioItemForm } from "@/components/portfolio-item-form";

interface SubmissionData {
  id: string;
  title: string | null;
  imageUrl: string | null;
  imageFocalPoint?: { x: number; y: number } | null;
  text: string | null;
  tags: string[];
  category: string | null;
  shareStatus?: "PRIVATE" | "PROFILE" | "PUBLIC";
  critiquesEnabled?: boolean;
}

interface SubmissionEditFormProps {
  submissionId: string;
  initialData: SubmissionData;
}

export function SubmissionEditForm({
  submissionId,
  initialData,
}: SubmissionEditFormProps) {
  const router = useRouter();

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
    <PortfolioItemForm
      mode="edit"
      initialData={initialData}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}
