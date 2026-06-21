"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  FullScreenModal,
  FullScreenModalContent,
  FullScreenModalHeader,
  FullScreenModalTitle,
  FullScreenModalDescription,
  FullScreenModalBody,
} from "@/components/ui/full-screen-modal";
import { BulkSubmissionCreateWizard } from "@/components/bulk-submission-create-wizard";
import { PortfolioItemForm } from "@/components/portfolio-item-form";
import { SubmissionCreateWizard } from "@/components/submission-create-wizard";

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
  commentsEnabled?: boolean;
}

interface SubmissionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: SubmissionData;
  initialDraft?: {
    id: string;
    title?: string | null;
    imageUrl?: string | null;
    category?: string | null;
  };
  onSuccess?: (data?: SubmissionData) => void;
  mode?: "create" | "bulk-create" | "edit" | "add-to-portfolio";
}

export function SubmissionEditModal({
  isOpen,
  onClose,
  initialData,
  initialDraft,
  onSuccess,
  mode = "edit",
}: SubmissionEditModalProps) {
  const router = useRouter();
  const t = useTranslations("modals.submissionEdit");

  const handleSuccess = (data?: SubmissionData) => {
    onSuccess?.(data);
    onClose();
    router.refresh();
  };

  const getTitle = () => {
    if (mode === "bulk-create") return t("bulkCreateTitle");
    if (mode === "add-to-portfolio") return t("addToPortfolioTitle");
    if (mode === "create") return t("createTitle");
    return t("editTitle");
  };

  const getDescription = () => {
    if (mode === "bulk-create") return t("bulkCreateDescription");
    if (mode === "add-to-portfolio") return t("addToPortfolioDescription");
    if (mode === "create") return t("createDescription");
    return t("editDescription");
  };

  return (
    <FullScreenModal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <FullScreenModalContent>
        <FullScreenModalHeader>
          <FullScreenModalTitle>{getTitle()}</FullScreenModalTitle>
          <FullScreenModalDescription>
            {getDescription()}
          </FullScreenModalDescription>
        </FullScreenModalHeader>
        <FullScreenModalBody>
          <div
            className={cn(
              "mx-auto w-full",
              mode === "bulk-create" ? "max-w-6xl" : "max-w-3xl",
            )}
          >
            {mode === "create" && (
              <SubmissionCreateWizard
                onSuccess={handleSuccess}
                onCancel={onClose}
                initialDraft={initialDraft}
              />
            )}
            {mode === "bulk-create" && (
              <BulkSubmissionCreateWizard
                onSuccess={() => handleSuccess()}
                onCancel={onClose}
              />
            )}
            {mode !== "create" && mode !== "bulk-create" && (
              <PortfolioItemForm
                mode="edit"
                initialData={initialData}
                onSuccess={handleSuccess}
                onCancel={onClose}
                setIsPortfolio={mode === "add-to-portfolio"}
              />
            )}
          </div>
        </FullScreenModalBody>
      </FullScreenModalContent>
    </FullScreenModal>
  );
}
