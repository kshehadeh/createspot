"use client";

import { useState, useRef } from "react";
import { User, Upload, Crosshair, Trash2, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FocalPointModal } from "@/components/focal-point-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { getUserImageUrl } from "@/lib/user-image";
import { getObjectPositionStyle } from "@/lib/image-utils";
import { toast } from "sonner";

interface ProfileImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageUrl: string | null;
  oauthImage: string | null;
  currentFocalPoint: { x: number; y: number } | null;
  onSave: (
    imageUrl: string | null,
    focalPoint: { x: number; y: number } | null,
  ) => Promise<void>;
}

export function ProfileImageModal({
  isOpen,
  onClose,
  currentImageUrl,
  oauthImage,
  currentFocalPoint,
  onSave,
}: ProfileImageModalProps) {
  const t = useTranslations("modals.profileImage");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocalPointModalOpen, setIsFocalPointModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayImage = getUserImageUrl(currentImageUrl, oauthImage);
  const hasUploadedImage = Boolean(currentImageUrl);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t("selectImageFile"));
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      setError(t("imageTooLarge"));
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Get presigned URL
      const presignResponse = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileType: file.type,
          fileSize: file.size,
          type: "profile",
        }),
      });

      if (!presignResponse.ok) {
        const data = await presignResponse.json().catch(() => null);
        throw new Error(data?.error || "Failed to get upload URL");
      }

      const presignData = await presignResponse.json();
      const { presignedUrl, publicUrl } = presignData;

      // Upload to R2 (post-processing runs in workflow after save)
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      const finalPublicUrl = publicUrl;

      // Delete old image if replacing
      if (currentImageUrl) {
        try {
          await fetch("/api/upload/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: currentImageUrl }),
          });
        } catch {
          // Ignore deletion errors
        }
      }

      // Save new image URL (reset focal point when uploading new image)
      await onSave(finalPublicUrl, null);
      toast.success(t("imageUploaded"));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("uploadFailed"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return;

    setUploading(true);
    setError(null);

    try {
      // Delete from R2
      await fetch("/api/upload/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: currentImageUrl }),
      });

      // Clear image URL and focal point
      await onSave(null, null);
      toast.success(t("imageRemoved"));
      setIsDeleteConfirmOpen(false);
      onClose();
    } catch {
      setError(t("removeFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleFocalPointSave = async (focalPoint: { x: number; y: number }) => {
    if (!currentImageUrl) return;

    try {
      await onSave(currentImageUrl, focalPoint);
      toast.success(t("focalPointUpdated"));
      setIsFocalPointModalOpen(false);
    } catch {
      setError(t("focalPointFailed"));
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col md:max-h-[90vh] h-screen md:h-auto md:rounded-lg md:m-4 md:max-w-2xl md:translate-x-[-50%] md:translate-y-[-50%] md:left-[50%] md:top-[50%] w-full m-0 rounded-none left-0 top-0 translate-x-0 translate-y-0">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
            {/* Current Image Display - Takes majority of space */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-md overflow-hidden rounded-lg bg-muted">
                {displayImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={displayImage}
                    alt="Profile"
                    className="h-auto w-full max-h-[60vh] object-contain"
                    style={{
                      objectPosition: getObjectPositionStyle(currentFocalPoint),
                    }}
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center">
                    <User className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            {uploading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {hasUploadedImage ? t("processing") : t("uploading")}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <DialogFooter className="flex-shrink-0 flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant={hasUploadedImage ? "outline" : "default"}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1"
            >
              {hasUploadedImage ? (
                <>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("change")}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {t("upload")}
                </>
              )}
            </Button>

            {hasUploadedImage && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFocalPointModalOpen(true)}
                  disabled={uploading}
                  className="flex-1"
                >
                  <Crosshair className="mr-2 h-4 w-4" />
                  {t("adjust")}
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  disabled={uploading}
                  className="flex-1"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("remove")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Focal Point Modal */}
      {currentImageUrl && (
        <FocalPointModal
          isOpen={isFocalPointModalOpen}
          onClose={() => setIsFocalPointModalOpen(false)}
          imageUrl={currentImageUrl}
          initialFocalPoint={currentFocalPoint}
          onSave={handleFocalPointSave}
          previewAspectRatio="circle"
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title={t("removeTitle")}
        message={t("removeMessage")}
        confirmLabel={t("remove")}
        onConfirm={handleRemoveImage}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        isLoading={uploading}
      />
    </>
  );
}
