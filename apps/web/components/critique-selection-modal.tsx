"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { SelectionDataInput } from "@/lib/critique-fragments";

const RichTextEditor = dynamic(
  () =>
    import("@/components/rich-text-editor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 rounded-md border border-input bg-muted/50 animate-pulse" />
    ),
  },
);

interface CritiqueSelectionModalProps {
  submissionId: string;
  selectionData: SelectionDataInput | null;
  imageUrl?: string; // Required when selectionData.type === "image"
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CritiqueSelectionModal({
  submissionId,
  selectionData,
  imageUrl,
  open,
  onClose,
  onSuccess,
}: CritiqueSelectionModalProps) {
  const t = useTranslations("critique");
  const tCommon = useTranslations("common");
  const [critiqueText, setCritiqueText] = useState("");
  const [saving, setSaving] = useState(false);
  const [fragmentPreview, setFragmentPreview] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Generate fragment preview when modal opens with image selection
  useEffect(() => {
    if (open && selectionData?.type === "image" && imageUrl) {
      setFragmentPreview(null);
      setPreviewError(null);
      import("@/lib/critique-fragments").then(
        async ({ extractImageFragment }) => {
          try {
            const fragment = await extractImageFragment(imageUrl, {
              x: selectionData.x,
              y: selectionData.y,
              width: selectionData.width,
              height: selectionData.height,
            });
            setFragmentPreview(fragment);
          } catch (error) {
            console.error("Failed to generate fragment preview:", error);
            setPreviewError(
              error instanceof Error ? error.message : "Failed to load preview",
            );
          }
        },
      );
    } else {
      setFragmentPreview(null);
      setPreviewError(null);
    }
  }, [open, selectionData, imageUrl]);

  const handleSubmit = async () => {
    if (!critiqueText.trim() || !selectionData) {
      toast.error(t("critiqueRequired"));
      return;
    }

    setSaving(true);
    try {
      // Use the already-generated fragment preview, or extract if not available
      let fragmentData: string | null = null;
      if (selectionData.type === "image" && imageUrl) {
        if (fragmentPreview) {
          fragmentData = fragmentPreview;
        } else {
          const { extractImageFragment } = await import(
            "@/lib/critique-fragments"
          );
          fragmentData = await extractImageFragment(imageUrl, {
            x: selectionData.x,
            y: selectionData.y,
            width: selectionData.width,
            height: selectionData.height,
          });
        }
      }

      const response = await fetch(
        `/api/submissions/${submissionId}/critiques`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            critique: critiqueText,
            selectionData:
              selectionData.type === "image"
                ? {
                    type: "image",
                    x: selectionData.x,
                    y: selectionData.y,
                    width: selectionData.width,
                    height: selectionData.height,
                    fragmentData, // Base64 image data
                  }
                : {
                    type: "text",
                    startIndex: selectionData.startIndex,
                    endIndex: selectionData.endIndex,
                    originalText: selectionData.originalText,
                  },
          }),
        },
      );

      if (!response.ok) {
        let errorMessage = tCommon("error");
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch {
          // Response body might be empty or invalid JSON
          errorMessage = `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      toast.success(t("critiqueCreated"));
      setCritiqueText("");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to create critique:", error);
      toast.error(error instanceof Error ? error.message : tCommon("error"));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setCritiqueText("");
      onClose();
    }
  };

  if (!selectionData) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("createCritique")}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          {/* Selection preview */}
          <div className="border border-border rounded-md p-4 bg-muted/50">
            <div className="text-sm font-medium mb-2">
              {selectionData.type === "image"
                ? t("imageSelection")
                : t("textSelection")}
            </div>
            {selectionData.type === "image" ? (
              <div className="relative w-full max-h-48 flex items-center justify-center bg-background rounded overflow-hidden">
                {fragmentPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fragmentPreview}
                    alt={t("imageSelection")}
                    className="max-w-full max-h-48 object-contain"
                  />
                ) : previewError ? (
                  <div className="h-32 w-full flex flex-col items-center justify-center text-muted-foreground gap-2 p-4 text-center">
                    <span className="text-destructive text-sm">
                      {t("previewLoadFailed")}
                    </span>
                    <span className="text-xs opacity-70">{previewError}</span>
                  </div>
                ) : (
                  <div className="h-32 w-full flex items-center justify-center text-muted-foreground">
                    Loading preview...
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm italic text-muted-foreground">
                &ldquo;{selectionData.originalText.slice(0, 100)}
                {selectionData.originalText.length > 100 ? "..." : ""}&rdquo;
              </div>
            )}
          </div>

          {/* Critique editor */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("critique")}
            </label>
            <RichTextEditor
              value={critiqueText}
              onChange={setCritiqueText}
              placeholder={t("critiquePlaceholder")}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={saving}>
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !critiqueText.trim()}
            >
              {saving ? tCommon("saving") : tCommon("submit")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
