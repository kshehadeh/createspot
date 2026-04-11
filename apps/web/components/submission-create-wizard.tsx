"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "@/components/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/confirm-modal";
import { FocalPointModal } from "@/components/focal-point-modal";
import {
  ProgressionEditor,
  type ProgressionFormItem,
} from "@/components/progression-editor";
import { Button } from "@createspot/ui-primitives/button";
import { Input } from "@createspot/ui-primitives/input";
import { Label } from "@createspot/ui-primitives/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@createspot/ui-primitives/select";
import { Switch } from "@/components/ui/switch";
import { CATEGORIES, getCategoryIcon } from "@/lib/categories";
import { cn, getCreatorUrl } from "@/lib/utils";

const FIELD_FLASH_MS = 2600;

type FieldFlash =
  | "step1Content"
  | "submissionImage"
  | "referenceImage"
  | "category"
  | null;

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

interface SubmissionData {
  id: string;
  title: string | null;
  imageUrl: string | null;
  imageFocalPoint?: { x: number; y: number } | null;
  referenceImageUrl?: string | null;
  text: string | null;
  tags: string[];
  category: string | null;
  shareStatus?: "PRIVATE" | "PROFILE" | "PUBLIC";
  critiquesEnabled?: boolean;
  isWorkInProgress?: boolean;
}

interface SubmissionCreateWizardProps {
  onSuccess?: (data?: SubmissionData) => void;
  onCancel?: () => void;
}

type WizardStep = 1 | 2 | 3 | 4;

export function SubmissionCreateWizard({
  onSuccess,
  onCancel,
}: SubmissionCreateWizardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("modals.portfolioItemForm");
  const tCritique = useTranslations("critique");
  const tCommon = useTranslations("common");
  const tUpload = useTranslations("upload");
  const tCategories = useTranslations("categories");
  const tReference = useTranslations("reference");
  const tWizard = useTranslations("modals.submissionWizard");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceFileInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const step1ContentRef = useRef<HTMLDivElement>(null);
  const submissionImageStep1Ref = useRef<HTMLDivElement>(null);
  const referenceImageStep2Ref = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const fieldFlashClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [step, setStep] = useState<WizardStep>(1);
  const [draftId, setDraftId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFocalPoint, setImageFocalPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [shareStatus, setShareStatus] = useState<
    "PRIVATE" | "PROFILE" | "PUBLIC"
  >("PRIVATE");
  const [critiquesEnabled, setCritiquesEnabled] = useState(false);
  const [isWorkInProgress, setIsWorkInProgress] = useState(false);
  const [referenceImageUrl, setReferenceImageUrl] = useState("");
  const [progressions, setProgressions] = useState<ProgressionFormItem[]>([]);
  const [imageChangedAfterDraft, setImageChangedAfterDraft] = useState(false);
  const [focalPointChangedAfterDraft, setFocalPointChangedAfterDraft] =
    useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadingReference, setUploadingReference] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldFlash, setFieldFlash] = useState<FieldFlash>(null);
  const [showRemoveImageConfirm, setShowRemoveImageConfirm] = useState(false);
  const [showRemoveReferenceConfirm, setShowRemoveReferenceConfirm] =
    useState(false);
  const [isFocalPointModalOpen, setIsFocalPointModalOpen] = useState(false);

  const showFormError = useCallback((message: string, flash: FieldFlash) => {
    toast.error(message);
    if (!flash) return;
    if (fieldFlashClearRef.current) {
      clearTimeout(fieldFlashClearRef.current);
    }
    setFieldFlash(flash);
    requestAnimationFrame(() => {
      let el: HTMLElement | null = null;
      if (flash === "step1Content") el = step1ContentRef.current;
      else if (flash === "category") el = categoryRef.current;
      else if (flash === "submissionImage") {
        el = submissionImageStep1Ref.current;
      } else if (flash === "referenceImage") {
        el = referenceImageStep2Ref.current;
      }
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    fieldFlashClearRef.current = setTimeout(() => {
      setFieldFlash(null);
      fieldFlashClearRef.current = null;
    }, FIELD_FLASH_MS);
  }, []);

  useEffect(
    () => () => {
      if (fieldFlashClearRef.current) {
        clearTimeout(fieldFlashClearRef.current);
      }
    },
    [],
  );

  const flashRingClass = (key: NonNullable<FieldFlash>) =>
    fieldFlash === key
      ? "rounded-lg ring-2 ring-destructive/80 ring-offset-2 ring-offset-background transition-shadow duration-300"
      : "transition-shadow duration-300";

  const validateStepOne = () => {
    if (!imageUrl && !text && !isWorkInProgress) {
      showFormError(t("errors.addImageOrText"), "step1Content");
      return false;
    }
    return true;
  };

  const saveDraft = async () => {
    const trimmedTags = tags
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
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
        category: null,
        shareStatus: "PRIVATE",
        critiquesEnabled: false,
        isWorkInProgress,
      }),
    });

    if (!response.ok) {
      throw new Error(t("errors.createFailed"));
    }

    const data = await response.json();
    return data.submission?.id as string | undefined;
  };

  const updateSubmission = async (submissionId: string, body: object) => {
    const response = await fetch(`/api/submissions/${submissionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(t("errors.updateFailed"));
    }
  };

  const persistProgressions = async (submissionId: string) => {
    if (progressions.length === 0) return;

    const deletedProgressions = progressions.filter((p) => p.isDeleted && p.id);
    for (const p of deletedProgressions) {
      await fetch(`/api/submissions/${submissionId}/progressions/${p.id}`, {
        method: "DELETE",
      });
    }

    const newProgressions = progressions.filter((p) => p.isNew && !p.isDeleted);
    for (const p of newProgressions) {
      await fetch(`/api/submissions/${submissionId}/progressions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: p.imageUrl,
          text: p.text,
          comment: p.comment,
        }),
      });
    }

    const modifiedProgressions = progressions.filter(
      (p) => p.isModified && !p.isNew && !p.isDeleted && p.id,
    );
    for (const p of modifiedProgressions) {
      await fetch(`/api/submissions/${submissionId}/progressions/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: p.imageUrl,
          text: p.text,
          comment: p.comment,
          order: p.order,
        }),
      });
    }

    const visibleProgressions = progressions.filter((p) => !p.isDeleted);
    const hasOrderChanges = visibleProgressions.some((p) => p.isModified);
    if (hasOrderChanges && visibleProgressions.some((p) => p.id)) {
      await fetch(`/api/submissions/${submissionId}/progressions/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: visibleProgressions
            .filter((p) => p.id)
            .map((p) => ({ id: p.id, order: p.order })),
        }),
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showFormError(t("errors.selectImageFile"), "submissionImage");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      showFormError(t("errors.imageTooLarge"), "submissionImage");
      return;
    }

    setUploading(true);
    try {
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
        throw new Error(t("errors.uploadFailed"));
      }

      const { presignedUrl, publicUrl } = await presignResponse.json();
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) {
        throw new Error(t("errors.uploadFailed"));
      }
      setImageUrl(publicUrl);
      if (draftId) {
        setImageChangedAfterDraft(true);
      }
    } catch (err) {
      showFormError(
        err instanceof Error ? err.message : t("errors.uploadFailed"),
        "submissionImage",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleReferenceImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !draftId) return;
    if (!file.type.startsWith("image/")) {
      showFormError(t("errors.selectImageFile"), "referenceImage");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      showFormError(t("errors.imageTooLarge"), "referenceImage");
      return;
    }

    setUploadingReference(true);
    try {
      const presignResponse = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileType: file.type,
          fileSize: file.size,
          type: "reference",
          submissionId: draftId,
        }),
      });
      if (!presignResponse.ok) {
        throw new Error(t("errors.uploadFailed"));
      }

      const { presignedUrl, publicUrl } = await presignResponse.json();
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) {
        throw new Error(t("errors.uploadFailed"));
      }
      setReferenceImageUrl(publicUrl);
    } catch (err) {
      showFormError(
        err instanceof Error ? err.message : t("errors.uploadFailed"),
        "referenceImage",
      );
    } finally {
      setUploadingReference(false);
    }
  };

  const handleRemoveImage = async () => {
    if (imageUrl) {
      await fetch("/api/upload/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      }).catch(() => null);
    }
    setImageUrl("");
    setImageFocalPoint(null);
    if (draftId) {
      setImageChangedAfterDraft(true);
      setFocalPointChangedAfterDraft(true);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveReferenceImage = async () => {
    if (referenceImageUrl) {
      await fetch("/api/upload/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: referenceImageUrl }),
      }).catch(() => null);
    }
    setReferenceImageUrl("");
    if (referenceFileInputRef.current) referenceFileInputRef.current.value = "";
  };

  const handleStepOneContinue = async () => {
    if (!validateStepOne()) return;

    setSaving(true);
    try {
      const id = await saveDraft();
      if (!id) throw new Error(t("errors.createFailed"));
      setDraftId(id);
      setImageChangedAfterDraft(false);
      setFocalPointChangedAfterDraft(false);
      setStep(2);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("errors.createFailed"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStepTwoContinue = async () => {
    if (!draftId) return;
    setSaving(true);
    try {
      await updateSubmission(draftId, {
        referenceImageUrl: referenceImageUrl || null,
      });
      setStep(3);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("errors.updateFailed"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStepThreeContinue = async () => {
    if (!draftId) return;
    setSaving(true);
    try {
      await persistProgressions(draftId);
      setStep(4);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("errors.updateFailed"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleFinalSave = async () => {
    if (!draftId) return;
    if (!category) {
      showFormError(t("errors.categoryRequired"), "category");
      return;
    }

    setSaving(true);
    try {
      const trimmedTags = tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      const updatePayload: Record<string, unknown> = {
        title: title || null,
        text: text || null,
        tags: trimmedTags,
        category: category || null,
        shareStatus,
        critiquesEnabled,
        referenceImageUrl: referenceImageUrl || null,
        isWorkInProgress,
      };
      if (imageChangedAfterDraft) {
        updatePayload.imageUrl = imageUrl || null;
        updatePayload.imageFocalPoint = imageFocalPoint || null;
      } else if (focalPointChangedAfterDraft) {
        updatePayload.imageFocalPoint = imageFocalPoint || null;
      }
      await updateSubmission(draftId, updatePayload);
      await persistProgressions(draftId);

      if (draftId && session?.user?.id) {
        const viewHref = `${getCreatorUrl({
          id: session.user.id,
          slug: session.user.slug ?? null,
        })}/s/${draftId}`;
        toast.success(tUpload("submissionSaved"), {
          action: {
            label: tCommon("view"),
            onClick: () => router.push(viewHref),
          },
        });
      } else {
        toast.success(tUpload("submissionSaved"));
      }

      onSuccess?.({
        id: draftId,
        title: title || null,
        imageUrl: imageUrl || null,
        imageFocalPoint: imageFocalPoint || null,
        referenceImageUrl: referenceImageUrl || null,
        text: text || null,
        tags: trimmedTags,
        category: category || null,
        shareStatus,
        critiquesEnabled,
        isWorkInProgress,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-6 space-y-3">
      <p className="text-sm font-medium text-muted-foreground">
        {tWizard("stepCounter", { current: step, total: 4 })}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className={`h-1.5 rounded-full ${
              idx <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 md:space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <input
        ref={referenceFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleReferenceImageUpload}
        className="hidden"
      />
      {renderStepIndicator()}

      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">
              {tWizard("steps.step1.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {tWizard("steps.step1.description")}
            </p>
          </div>

          <div
            ref={step1ContentRef}
            className={cn(
              "space-y-6 rounded-md p-1 -m-1",
              flashRingClass("step1Content"),
            )}
          >
            <div
              ref={submissionImageStep1Ref}
              className={cn("space-y-2", flashRingClass("submissionImage"))}
            >
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
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsFocalPointModalOpen(true)}
                      className="bg-black/50 text-white hover:bg-black/70"
                    >
                      {t("setFocalPoint")}
                    </Button>
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
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50"
                >
                  {uploading ? (
                    <span className="text-sm text-muted-foreground">
                      {t("uploading")}
                    </span>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {t("clickToUpload")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        {t("uploadFormat")}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("textDescription")}</Label>
              <RichTextEditor
                value={text}
                onChange={setText}
                placeholder={t("textPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("tags")}</Label>
              <p className="text-xs text-muted-foreground">{t("tagHelper")}</p>
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
                      const trimmed = e.currentTarget.value.trim();
                      if (trimmed && !tags.includes(trimmed)) {
                        setTags((curr) => [...curr, trimmed]);
                        setTagInput("");
                      } else if (trimmed) {
                        setTagInput("");
                      }
                    }
                  }}
                  placeholder={
                    tags.length === 0 ? t("tagPlaceholderEmpty") : ""
                  }
                  className="flex-1 min-w-[120px] border-0 bg-transparent px-0 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isWorkInProgress">
                    {t("workInProgress")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("workInProgressDescription")}
                  </p>
                </div>
                <Switch
                  id="isWorkInProgress"
                  checked={isWorkInProgress}
                  onCheckedChange={setIsWorkInProgress}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between gap-3 border-t border-border/60 pt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleStepOneContinue}
              disabled={saving || uploading}
            >
              {saving ? t("saving") : tCommon("next")}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">
              {tWizard("steps.step2.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {tWizard("steps.step2.description")}
            </p>
          </div>

          <div
            ref={referenceImageStep2Ref}
            className={cn("space-y-2", flashRingClass("referenceImage"))}
          >
            <Label>{tReference("title")}</Label>
            {referenceImageUrl ? (
              <div className="relative">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={referenceImageUrl}
                    alt={tReference("title")}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 100vw, 512px"
                  />
                </div>
                <div className="absolute top-2 right-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => setShowRemoveReferenceConfirm(true)}
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
              </div>
            ) : (
              <div
                onClick={() => referenceFileInputRef.current?.click()}
                className="w-full cursor-pointer rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50"
              >
                {uploadingReference ? (
                  <span className="text-sm text-muted-foreground">
                    {t("uploading")}
                  </span>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {t("clickToUpload")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      {t("uploadFormat")}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              {tCommon("back")}
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(3)}
                disabled={saving}
              >
                {tWizard("skip")}
              </Button>
              <Button
                type="button"
                onClick={handleStepTwoContinue}
                disabled={saving || uploadingReference}
              >
                {saving ? t("saving") : tCommon("next")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && draftId && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">
              {tWizard("steps.step3.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {tWizard("steps.step3.description")}
            </p>
          </div>

          <ProgressionEditor
            submissionId={draftId}
            initialProgressions={progressions}
            onChange={setProgressions}
            disabled={saving}
          />

          <div className="flex justify-between gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>
              {tCommon("back")}
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(4)}
                disabled={saving}
              >
                {tWizard("skip")}
              </Button>
              <Button
                type="button"
                onClick={handleStepThreeContinue}
                disabled={saving}
              >
                {saving ? t("saving") : tCommon("next")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">
              {tWizard("steps.step4.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {tWizard("steps.step4.description")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">{t("title")}</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
            />
          </div>

          <div
            ref={categoryRef}
            className={cn("space-y-2", flashRingClass("category"))}
          >
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

          <div className="space-y-2">
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

          <div className="space-y-2">
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
                disabled={shareStatus === "PRIVATE"}
              />
            </div>
            {shareStatus === "PRIVATE" && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {tCritique("critiquesDisabledWhenPrivate")}
              </p>
            )}
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            {tUpload("ownershipNotice")}{" "}
            <Link href="/about#protecting-your-work" className="underline">
              {tWizard("rightsLearnMore")}
            </Link>
          </div>

          <div className="flex justify-between gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(3)}>
              {tCommon("back")}
            </Button>
            <Button type="button" onClick={handleFinalSave} disabled={saving}>
              {saving ? t("saving") : tWizard("finalSave")}
            </Button>
          </div>
        </div>
      )}

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

      <ConfirmModal
        isOpen={showRemoveReferenceConfirm}
        title={tReference("removeReference")}
        message={tReference("removeReferenceConfirm")}
        confirmLabel={tReference("removeReference")}
        onConfirm={() => {
          handleRemoveReferenceImage();
          setShowRemoveReferenceConfirm(false);
        }}
        onCancel={() => setShowRemoveReferenceConfirm(false)}
      />

      {imageUrl && (
        <FocalPointModal
          isOpen={isFocalPointModalOpen}
          onClose={() => setIsFocalPointModalOpen(false)}
          imageUrl={imageUrl}
          initialFocalPoint={imageFocalPoint}
          onSave={(value) => {
            setImageFocalPoint(value);
            if (draftId) {
              setFocalPointChangedAfterDraft(true);
            }
          }}
          previewAspectRatio="square"
        />
      )}
    </div>
  );
}
