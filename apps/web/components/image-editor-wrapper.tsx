"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ConfirmModal } from "@/components/confirm-modal";
import {
  FullScreenModal,
  FullScreenModalContent,
  FullScreenModalHeader,
  FullScreenModalTitle,
  FullScreenModalBody,
} from "@/components/ui/full-screen-modal";

// Heavy component - dynamically import to reduce initial bundle
const ImageEditor = dynamic(
  () => import("@/components/image-editor").then((mod) => mod.ImageEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    ),
  },
);

interface ImageEditorWrapperProps {
  submissionId: string;
  imageUrl: string;
  submissionTitle: string | null;
  backHref?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onImageSaved?: (imageUrl: string) => void;
}

export function ImageEditorWrapper({
  submissionId,
  imageUrl,
  submissionTitle,
  backHref,
  open,
  onOpenChange,
  onImageSaved,
}: ImageEditorWrapperProps) {
  const router = useRouter();
  const t = useTranslations("imageEditor");
  const [internalOpen, setInternalOpen] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const isControlled = typeof open === "boolean";
  const isOpen = isControlled ? open : internalOpen;

  useEffect(() => {
    if (!isOpen) {
      setHasUnsavedChanges(false);
    }
  }, [isOpen]);

  const commitClose = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
      if (!next && backHref) {
        router.push(backHref);
      }
    },
    [isControlled, onOpenChange, backHref, router],
  );

  const handleOpenChange = (next: boolean) => {
    if (!next && hasUnsavedChanges) {
      setShowDiscardConfirm(true);
      return;
    }
    commitClose(next);
  };

  return (
    <>
      <FullScreenModal open={isOpen} onOpenChange={handleOpenChange}>
        <FullScreenModalContent>
          <FullScreenModalHeader className="sr-only">
            <FullScreenModalTitle>
              {submissionTitle || "Image Editor"}
            </FullScreenModalTitle>
          </FullScreenModalHeader>
          <FullScreenModalBody className="p-4 sm:p-6">
            <div className="mx-auto w-full max-w-7xl">
              <ImageEditor
                submissionId={submissionId}
                imageUrl={imageUrl}
                submissionTitle={submissionTitle}
                onImageSaved={onImageSaved}
                onDirtyChange={setHasUnsavedChanges}
              />
            </div>
          </FullScreenModalBody>
        </FullScreenModalContent>
      </FullScreenModal>
      <ConfirmModal
        isOpen={showDiscardConfirm}
        title={t("unsavedCloseTitle")}
        message={t("unsavedCloseMessage")}
        confirmLabel={t("discardChanges")}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          commitClose(false);
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </>
  );
}
