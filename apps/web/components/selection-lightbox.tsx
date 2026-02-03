"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import type { SelectionData } from "@/lib/critique-fragments";

interface SelectionLightboxProps {
  selectionData: SelectionData | null;
  open: boolean;
  onClose: () => void;
}

export function SelectionLightbox({
  selectionData,
  open,
  onClose,
}: SelectionLightboxProps) {
  const t = useTranslations("critique");

  if (!selectionData) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {selectionData.type === "image"
              ? t("imageSelection")
              : t("textSelection")}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {selectionData.type === "image" ? (
            <div className="relative w-full aspect-square max-h-[70vh]">
              <Image
                src={selectionData.fragmentUrl}
                alt={t("imageSelection")}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 80vw"
              />
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <blockquote className="border-l-4 border-primary pl-4 py-2 my-0 italic text-foreground">
                {selectionData.originalText}
              </blockquote>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
