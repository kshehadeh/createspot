"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
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
  const [internalOpen, setInternalOpen] = useState(true);
  const isControlled = typeof open === "boolean";
  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (open: boolean) => {
    if (!isControlled) {
      setInternalOpen(open);
    }
    onOpenChange?.(open);
    if (!open) {
      if (backHref) {
        router.push(backHref);
      }
    }
  };

  return (
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
            />
          </div>
        </FullScreenModalBody>
      </FullScreenModalContent>
    </FullScreenModal>
  );
}
