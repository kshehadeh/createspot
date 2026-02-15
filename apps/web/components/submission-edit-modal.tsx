"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BaseModal,
  BaseModalContent,
  BaseModalHeader,
  BaseModalTitle,
  BaseModalDescription,
  BaseModalScrollArea,
} from "@/components/ui/base-modal";
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

interface SubmissionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: SubmissionData;
  onSuccess?: (data?: SubmissionData) => void;
  mode?: "create" | "edit" | "add-to-portfolio";
}

export function SubmissionEditModal({
  isOpen,
  onClose,
  initialData,
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
    if (mode === "add-to-portfolio") return t("addToPortfolioTitle");
    if (mode === "create") return t("createTitle");
    return t("editTitle");
  };

  const getDescription = () => {
    if (mode === "add-to-portfolio") return t("addToPortfolioDescription");
    if (mode === "create") return t("createDescription");
    return t("editDescription");
  };

  return (
    <BaseModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      dismissible={false}
    >
      <BaseModalContent className="max-w-2xl p-0">
        <BaseModalHeader>
          <BaseModalTitle>{getTitle()}</BaseModalTitle>
          <BaseModalDescription>{getDescription()}</BaseModalDescription>
        </BaseModalHeader>
        <BaseModalScrollArea>
          <PortfolioItemForm
            mode={mode === "create" ? "create" : "edit"}
            initialData={initialData}
            onSuccess={handleSuccess}
            onCancel={onClose}
            setIsPortfolio={mode === "add-to-portfolio"}
          />
        </BaseModalScrollArea>
      </BaseModalContent>
    </BaseModal>
  );
}
