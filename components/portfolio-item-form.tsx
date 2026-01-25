"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import {
  Crosshair,
  ImageIcon,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { RichTextEditor } from "@/components/rich-text-editor";
import { ConfirmModal } from "@/components/confirm-modal";
import { FocalPointModal } from "@/components/focal-point-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CATEGORIES, getCategoryIcon } from "@/lib/categories";
import {
  getImageMetadata,
  type ImageMetadata,
} from "@/lib/image-editor/metadata";

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

interface PortfolioItemFormProps {
  mode: "create" | "edit";
  initialData?: SubmissionData;
  onSuccess?: (data?: SubmissionData) => void;
  onCancel?: () => void;
  setIsPortfolio?: boolean;
}

export function PortfolioItemForm({
  mode,
  initialData,
  onSuccess,
  onCancel,
  setIsPortfolio = false,
}: PortfolioItemFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("modals.portfolioItemForm");
  const tCritique = useTranslations("critique");
  const tCommon = useTranslations("common");
  const tCategories = useTranslations("categories");
  const tUpload = useTranslations("upload");
  const tImageEditor = useTranslations("imageEditor");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialData?.title || "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [text, setText] = useState(initialData?.text || "");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState(initialData?.category || "");
  const [shareStatus, setShareStatus] = useState<
    "PRIVATE" | "PROFILE" | "PUBLIC"
  >(initialData?.shareStatus || "PRIVATE");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRemoveImageConfirm, setShowRemoveImageConfirm] = useState(false);
  const [imageFocalPoint, setImageFocalPoint] = useState<{
    x: number;
    y: number;
  } | null>(initialData?.imageFocalPoint || null);
  const [isFocalPointModalOpen, setIsFocalPointModalOpen] = useState(false);
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [critiquesEnabled, setCritiquesEnabled] = useState(
    initialData?.critiquesEnabled ?? false,
  );
  const [imageMetadata, setImageMetadata] = useState<ImageMetadata | null>(
    null,
  );
  const [isImageInfoOpen, setIsImageInfoOpen] = useState(false);
  const [submissionUserId, setSubmissionUserId] = useState<string | null>(null);

  // Fetch watermark setting and submission user ID on mount
  useEffect(() => {
    const fetchWatermarkSetting = async () => {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setWatermarkEnabled(data.enableWatermark ?? false);
        }
      } catch {
        // Silently fail - watermark indicator is not critical
      }
    };
    fetchWatermarkSetting();
  }, []);

  // Fetch submission user ID if in edit mode
  useEffect(() => {
    if (mode === "edit" && initialData?.id) {
      const fetchSubmission = async () => {
        try {
          const response = await fetch(`/api/submissions/${initialData.id}`);
          if (response.ok) {
            const data = await response.json();
            setSubmissionUserId(data.submission.userId);
          }
        } catch {
          // Silently fail
        }
      };
      fetchSubmission();
    }
  }, [mode, initialData?.id]);

  // Load image metadata when imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      const loadMetadata = async () => {
        try {
          const metadata = await getImageMetadata(imageUrl);
          setImageMetadata(metadata);
        } catch {
          // Silently fail - metadata is optional and some images may not be accessible
          // due to CORS restrictions or other issues
          setImageMetadata(null);
        }
      };
      loadMetadata();
    } else {
      setImageMetadata(null);
    }
  }, [imageUrl]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t("errors.selectImageFile"));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(t("errors.imageTooLarge"));
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
          type: "submission",
        }),
      });

      if (!presignResponse.ok) {
        const data = await presignResponse.json().catch(() => null);
        throw new Error(data?.error || "Failed to get upload URL");
      }

      const presignData = await presignResponse.json();

      let finalPublicUrl: string;

      // Check if server requires server-side upload (e.g., for watermarking)
      if (presignData.useServerUpload) {
        // Fall back to server-side upload route
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "submission");

        const serverUploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!serverUploadResponse.ok) {
          const errorData = await serverUploadResponse.json().catch(() => null);
          throw new Error(errorData?.error || "Server upload failed");
        }

        const { imageUrl } = await serverUploadResponse.json();
        finalPublicUrl = imageUrl;
      } else {
        // Use presigned URL for direct upload to R2
        const { presignedUrl, publicUrl } = presignData;

        // Upload to R2
        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }

        finalPublicUrl = publicUrl;
      }

      setImageUrl(finalPublicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (imageUrl) {
      try {
        await fetch("/api/upload/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl }),
        });
      } catch {
        // Ignore deletion errors
      }
    }
    setImageUrl("");
    setImageFocalPoint(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageUrl && !text) {
      setError(t("errors.addImageOrText"));
      return;
    }

    if (!category) {
      setError(t("errors.categoryRequired"));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const trimmedTags = tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      if (mode === "create") {
        const response = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title || null,
            imageUrl: imageUrl || null,
            imageFocalPoint: imageFocalPoint || null,
            text: text || null,
            isPortfolio: true,
            tags: trimmedTags,
            category: category || null,
            shareStatus,
            critiquesEnabled,
          }),
        });

        if (!response.ok) {
          throw new Error(t("errors.createFailed"));
        }
      } else if (initialData) {
        const response = await fetch(`/api/submissions/${initialData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title || null,
            imageUrl: imageUrl || null,
            imageFocalPoint: imageFocalPoint || null,
            text: text || null,
            tags: trimmedTags,
            category: category || null,
            shareStatus,
            critiquesEnabled,
            ...(setIsPortfolio ? { isPortfolio: true } : {}),
          }),
        });

        if (!response.ok) {
          throw new Error(t("errors.updateFailed"));
        }
      }

      if (onSuccess) {
        // Pass the updated data back for edit mode
        const updatedData: SubmissionData | undefined = initialData
          ? {
              id: initialData.id,
              title: title || null,
              imageUrl: imageUrl || null,
              imageFocalPoint: imageFocalPoint || null,
              text: text || null,
              tags: trimmedTags,
              category: category || null,
              shareStatus,
              critiquesEnabled,
            }
          : undefined;
        onSuccess(updatedData);
      } else {
        router.refresh();
      }
    } catch {
      setError(t("errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="title">{t("title")}</Label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titlePlaceholder")}
        />
      </div>

      <div>
        <Label>{t("image")}</Label>
        {imageUrl ? (
          <div className="relative">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
              <Image
                src={imageUrl}
                alt="Preview"
                fill
                className="object-contain"
                sizes="(max-width: 640px) 100vw, 512px"
              />
            </div>
            <div className="absolute top-2 right-2 flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      onClick={() => setIsFocalPointModalOpen(true)}
                      className="bg-black/50 text-white hover:bg-black/70"
                    >
                      <Crosshair className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {imageFocalPoint
                      ? t("focalPoint", {
                          x: imageFocalPoint.x.toFixed(0),
                          y: imageFocalPoint.y.toFixed(0),
                        })
                      : t("setFocalPoint")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => setShowRemoveImageConfirm(true)}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>
            {/* Cleanup Image button - only shown in edit mode */}
            {mode === "edit" && initialData?.id && (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full sm:w-auto"
                >
                  <Link
                    href={
                      submissionUserId
                        ? `/creators/${submissionUserId}/s/${initialData.id}/edit/image`
                        : "#"
                    }
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {t("cleanupImage")}
                  </Link>
                </Button>
                <p className="hidden text-sm text-muted-foreground sm:block">
                  {t("cleanupImageDescription")}
                </p>
              </div>
            )}
            {/* Image metadata - collapsible */}
            {imageMetadata && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setIsImageInfoOpen(!isImageInfoOpen)}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    {tImageEditor("imageInfo")}
                  </span>
                  {isImageInfoOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {isImageInfoOpen && (
                  <div className="mt-2 space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {tImageEditor("dimensions")}:
                      </span>
                      <span className="font-mono">
                        {imageMetadata.width} × {imageMetadata.height}
                      </span>
                    </div>
                    {imageMetadata.format && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {tImageEditor("format")}:
                        </span>
                        <span className="font-mono uppercase">
                          {imageMetadata.format}
                        </span>
                      </div>
                    )}
                    {imageMetadata.size && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {tImageEditor("fileSize")}:
                        </span>
                        <span className="font-mono">
                          {(imageMetadata.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    )}
                    {imageMetadata.colorDepth && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {tImageEditor("colorDepth")}:
                        </span>
                        <span className="font-mono">
                          {imageMetadata.colorDepth} bit
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {uploading ? (
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin text-muted-foreground"
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
                <span className="text-sm text-muted-foreground">
                  {t("uploading")}
                </span>
              </div>
            ) : (
              <>
                <svg
                  className="mx-auto h-8 w-8 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("clickToUpload")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {t("uploadFormat")}
                </p>
              </>
            )}
          </div>
        )}
        {watermarkEnabled && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <svg
              className="h-3.5 w-3.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>
              {tUpload("watermarkEnabled")}{" "}
              {session?.user?.id && (
                <Link
                  href={`/creators/${session.user.id}/edit`}
                  className="underline hover:text-foreground"
                >
                  {tUpload("changeSettings")}
                </Link>
              )}
            </span>
          </div>
        )}
      </div>

      <div>
        <Label>{t("textDescription")}</Label>
        <RichTextEditor
          value={text}
          onChange={setText}
          placeholder={t("textPlaceholder")}
        />
      </div>

      <div>
        <Label>{t("category")}</Label>
        <Select
          value={category || "__none__"}
          onValueChange={(value) =>
            setCategory(value === "__none__" ? "" : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("categoryPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">{t("categoryNone")}</SelectItem>
            {CATEGORIES.map((cat) => {
              const IconComponent = getCategoryIcon(cat);
              return (
                <SelectItem key={cat} value={cat}>
                  <div className="flex items-center gap-2">
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    {tCategories(cat)}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>{t("tags")}</Label>
        <div className="flex min-h-[42px] flex-wrap items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 focus-within:border-ring focus-within:outline-none focus-within:ring-2 focus-within:ring-ring">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-sm text-secondary-foreground"
            >
              {tag}
              <button
                type="button"
                onClick={() => {
                  setTags(tags.filter((_, i) => i !== index));
                  tagInputRef.current?.focus();
                }}
                className="ml-0.5 rounded hover:bg-secondary/80"
                aria-label={t("removeTag", { tag })}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          ))}
          <input
            ref={tagInputRef}
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                const currentValue = e.currentTarget.value;
                const trimmed = currentValue.trim();
                if (trimmed && !tags.includes(trimmed)) {
                  setTags([...tags, trimmed]);
                  setTagInput("");
                } else if (trimmed) {
                  setTagInput("");
                }
              } else if (
                e.key === "Backspace" &&
                e.currentTarget.value === "" &&
                tags.length > 0
              ) {
                setTags(tags.slice(0, -1));
              }
            }}
            placeholder={tags.length === 0 ? t("tagPlaceholderEmpty") : ""}
            className="flex-1 min-w-[120px] border-0 bg-transparent px-0 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{t("tagHelper")}</p>
      </div>

      <div>
        <Label>{t("visibility")}</Label>
        <div className="space-y-2">
          {[
            {
              value: "PUBLIC",
              label: t("shareStatus.public"),
              description: t("shareStatus.publicDescription"),
            },
            {
              value: "PROFILE",
              label: t("shareStatus.profileOnly"),
              description: t("shareStatus.profileOnlyDescription"),
            },
            {
              value: "PRIVATE",
              label: t("shareStatus.private"),
              description: t("shareStatus.privateDescription"),
            },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                shareStatus === option.value
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input
                type="radio"
                name="shareStatus"
                value={option.value}
                checked={shareStatus === option.value}
                onChange={(e) =>
                  setShareStatus(
                    e.target.value as "PRIVATE" | "PROFILE" | "PUBLIC",
                  )
                }
                className="mt-0.5"
              />
              <div>
                <div className="text-sm font-medium text-foreground">
                  {option.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {option.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="critiquesEnabled">
              {tCritique("enableCritiques")}
            </Label>
            <p className="text-xs text-muted-foreground">
              {tCritique("enableCritiquesDescription")}
            </p>
          </div>
          <Switch
            id="critiquesEnabled"
            checked={critiquesEnabled}
            onCheckedChange={setCritiquesEnabled}
          />
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
        <svg
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{tUpload("ownershipNotice")}</span>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving || uploading}>
          {saving
            ? t("saving")
            : mode === "create"
              ? t("addToPortfolio")
              : t("saveChanges")}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
        )}
      </div>

      {/* Remove Image Confirmation Modal */}
      <ConfirmModal
        isOpen={showRemoveImageConfirm}
        title={t("removeImageTitle")}
        message={t("removeImageMessage")}
        confirmLabel={t("removeImage")}
        onConfirm={() => {
          handleRemoveImage();
          setShowRemoveImageConfirm(false);
        }}
        onCancel={() => setShowRemoveImageConfirm(false)}
      />

      {/* Focal Point Modal */}
      {imageUrl && (
        <FocalPointModal
          isOpen={isFocalPointModalOpen}
          onClose={() => setIsFocalPointModalOpen(false)}
          imageUrl={imageUrl}
          initialFocalPoint={imageFocalPoint}
          onSave={setImageFocalPoint}
          previewAspectRatio="square"
        />
      )}
    </form>
  );
}
