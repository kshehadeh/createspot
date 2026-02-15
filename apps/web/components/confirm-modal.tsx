"use client";

import { useTranslations } from "next-intl";
import {
  BaseModal,
  BaseModalContent,
  BaseModalDescription,
  BaseModalFooter,
  BaseModalHeader,
  BaseModalTitle,
} from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmModalProps) {
  const t = useTranslations("modals.confirm");
  const tCommon = useTranslations("common");
  const defaultConfirmLabel = confirmLabel ?? t("defaultDelete");
  const defaultCancelLabel = cancelLabel ?? tCommon("cancel");

  return (
    <BaseModal
      open={isOpen}
      onOpenChange={(open) => !open && onCancel()}
      dismissible={!isLoading}
    >
      <BaseModalContent>
        <BaseModalHeader>
          <BaseModalTitle>{title}</BaseModalTitle>
          <BaseModalDescription>{message}</BaseModalDescription>
        </BaseModalHeader>
        <BaseModalFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {defaultCancelLabel}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? t("defaultDeleting") : defaultConfirmLabel}
          </Button>
        </BaseModalFooter>
      </BaseModalContent>
    </BaseModal>
  );
}
