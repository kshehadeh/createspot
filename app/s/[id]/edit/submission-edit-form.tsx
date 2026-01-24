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

  const handleSuccess = () => {
    // Navigate back to the submission page and refresh
    router.push(`/s/${submissionId}`);
    router.refresh();
  };

  const handleCancel = () => {
    // Navigate back to the submission page
    router.push(`/s/${submissionId}`);
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
