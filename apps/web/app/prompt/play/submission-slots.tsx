"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import type { Submission } from "@/app/generated/prisma/client";
import { TextThumbnail } from "@/components/text-thumbnail";

// Heavy TipTap editor - dynamically import
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
import { ConfirmModal } from "@/components/confirm-modal";
import { getObjectPositionStyle } from "@/lib/image-utils";
import { getCreatorUrl } from "@/lib/utils";

interface PortfolioItem {
  id: string;
  title: string | null;
  imageUrl: string | null;
  imageFocalPoint?: { x: number; y: number } | null;
  text: string | null;
  category: string | null;
}

interface SubmissionSlotsProps {
  promptId: string;
  words: string[];
  existingSubmissions: Record<number, Submission>;
  portfolioItems: PortfolioItem[];
  watermarkEnabled?: boolean;
}

export function SubmissionSlots({
  promptId,
  words,
  existingSubmissions,
  portfolioItems,
  watermarkEnabled = false,
}: SubmissionSlotsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("upload");
  const tCommon = useTranslations("common");
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showPortfolioSelector, setShowPortfolioSelector] = useState(false);

  const [formData, setFormData] = useState<{
    title: string;
    text: string;
    imageUrl: string;
  }>({ title: "", text: "", imageUrl: "" });

  // Track original image URL (from existing submission) and newly uploaded URLs
  const [originalImageUrl, setOriginalImageUrl] = useState<string>("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Track if using a portfolio item
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(
    null,
  );

  // Helper to delete an image from R2
  async function deleteImage(imageUrl: string) {
    if (!imageUrl) return;
    try {
      await fetch("/api/upload/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
    } catch (err) {
      // Silently fail - cleanup is best-effort
      console.error("Failed to delete image:", err);
    }
  }

  // Clean up all uploaded images that weren't saved
  async function cleanupUploadedImages(savedImageUrl?: string) {
    const imagesToDelete = uploadedImages.filter(
      (url) => url !== savedImageUrl && url !== originalImageUrl,
    );
    await Promise.all(imagesToDelete.map(deleteImage));
    setUploadedImages([]);
  }

  function openSlot(wordIndex: number) {
    const existing = existingSubmissions[wordIndex];
    const existingImageUrl = existing?.imageUrl || "";
    setFormData({
      title: existing?.title || "",
      text: existing?.text || "",
      imageUrl: existingImageUrl,
    });
    setOriginalImageUrl(existingImageUrl);
    setUploadedImages([]);
    setActiveSlot(wordIndex);
    setError(null);
    setSelectedPortfolioId(null);
    setShowPortfolioSelector(false);
  }

  async function closeSlot() {
    // Clean up any uploaded images before closing
    await cleanupUploadedImages();
    setActiveSlot(null);
    setFormData({ title: "", text: "", imageUrl: "" });
    setOriginalImageUrl("");
    setError(null);
    setSelectedPortfolioId(null);
    setShowPortfolioSelector(false);
  }

  function selectPortfolioItem(item: PortfolioItem) {
    setSelectedPortfolioId(item.id);
    setFormData({
      title: item.title || "",
      text: item.text || "",
      imageUrl: item.imageUrl || "",
    });
    setShowPortfolioSelector(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation before upload
    const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB
    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(
        "Invalid file type. Please choose a JPEG, PNG, WebP, or GIF image.",
      );
      // Reset the file input
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(
        `File is too large (${fileSizeMB} MB). Maximum file size is 6 MB. Please choose a smaller image.`,
      );
      // Reset the file input
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Step 1: Get presigned URL from server
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
        const data = await presignResponse.json();
        throw new Error(data.error || "Failed to get upload URL");
      }

      const presignData = await presignResponse.json();
      const { presignedUrl, publicUrl } = presignData;

      // Upload directly to R2 using presigned URL (post-processing runs in workflow after save)
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        if (uploadResponse.status === 0 || uploadResponse.status === 403) {
          throw new Error(
            "CORS error: Please configure CORS on your R2 bucket to allow uploads from this origin. See docs/DATABASE.md for instructions.",
          );
        }
        throw new Error(
          `Upload to storage failed: ${uploadResponse.status} ${uploadResponse.statusText}`,
        );
      }

      const finalPublicUrl = publicUrl;

      // Track this upload for potential cleanup
      setUploadedImages((prev) => [...prev, finalPublicUrl]);
      setFormData((prev) => ({ ...prev, imageUrl: finalPublicUrl }));
      // Clear portfolio selection since user is uploading new content
      setSelectedPortfolioId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (activeSlot === null) return;

    setIsSaving(true);
    setError(null);

    let submissionId: string | null = null;

    try {
      // If using a portfolio item, link it to the prompt
      if (selectedPortfolioId) {
        const response = await fetch(
          `/api/submissions/${selectedPortfolioId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              promptId,
              wordIndex: activeSlot,
            }),
          },
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to link portfolio item");
        }
        submissionId = selectedPortfolioId;
      } else {
        // Regular submission flow
        const response = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            promptId,
            wordIndex: activeSlot,
            ...formData,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to save");
        }

        const data = await response.json();
        submissionId = data.submission?.id ?? null;

        // Clean up any replaced images (keep only the saved one)
        await cleanupUploadedImages(formData.imageUrl);

        // If the user replaced the original image with a new one, delete the old one
        if (originalImageUrl && originalImageUrl !== formData.imageUrl) {
          await deleteImage(originalImageUrl);
        }
      }

      setActiveSlot(null);
      setFormData({ title: "", text: "", imageUrl: "" });
      setOriginalImageUrl("");
      setError(null);
      setSelectedPortfolioId(null);
      router.refresh();

      if (submissionId && session?.user?.id) {
        const viewHref = `${getCreatorUrl({
          id: session.user.id,
          slug: session.user.slug ?? null,
        })}/s/${submissionId}`;
        toast.success(t("submissionSaved"), {
          action: {
            label: tCommon("view"),
            onClick: () => router.push(viewHref),
          },
        });
      } else {
        toast.success(t("submissionSaved"));
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("submissionFailed");
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClearAll() {
    setIsClearing(true);
    setError(null);

    try {
      const response = await fetch(`/api/submissions?promptId=${promptId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to clear submissions");
      }

      setShowClearModal(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to clear submissions",
      );
    } finally {
      setIsClearing(false);
    }
  }

  const hasAnySubmissions = Object.keys(existingSubmissions).length > 0;

  return (
    <div className="space-y-6">
      {hasAnySubmissions && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowClearModal(true)}
            className="rounded-lg border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            Clear
          </button>
        </div>
      )}

      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-center">
        {words.map((word, index) => {
          const wordIndex = index + 1;
          const submission = existingSubmissions[wordIndex];

          return (
            <div
              key={wordIndex}
              className="flex w-full flex-col rounded-xl border border-border bg-card p-4 md:w-[350px]"
            >
              <h3 className="mb-4 text-center text-lg font-semibold text-foreground">
                {word}
              </h3>

              <div className="flex flex-1 flex-col">
                {submission ? (
                  <div className="flex flex-1 flex-col space-y-4">
                    {submission.imageUrl ? (
                      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={submission.imageUrl}
                          alt={submission.title || word}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 33vw"
                          style={{
                            objectPosition: getObjectPositionStyle(
                              submission.imageFocalPoint as {
                                x: number;
                                y: number;
                              } | null,
                            ),
                          }}
                        />
                      </div>
                    ) : submission.text ? (
                      <TextThumbnail
                        text={submission.text}
                        className="aspect-square rounded-lg"
                      />
                    ) : null}
                    {submission.title && (
                      <p className="font-medium text-foreground">
                        {submission.title}
                      </p>
                    )}
                    <button
                      onClick={() => openSlot(wordIndex)}
                      className="mt-auto w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => openSlot(wordIndex)}
                    className="flex aspect-square w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                  >
                    <svg
                      className="mb-2 h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="text-sm font-medium">Add submission</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeSlot !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onClick={closeSlot}
        >
          <div
            className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">
                {existingSubmissions[activeSlot]
                  ? "Edit submission"
                  : "New submission"}{" "}
                for &quot;{words[activeSlot - 1]}&quot;
              </h3>
              <button
                onClick={closeSlot}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <svg
                  className="h-6 w-6"
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
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Portfolio Selector */}
            {portfolioItems.length > 0 &&
              !existingSubmissions[activeSlot] &&
              !selectedPortfolioId && (
                <div className="mb-6">
                  {showPortfolioSelector ? (
                    <div className="rounded-lg border border-border">
                      <div className="flex items-center justify-between border-b border-border p-3">
                        <span className="text-sm font-medium text-foreground">
                          Select from Portfolio
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPortfolioSelector(false)}
                          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-2">
                        {portfolioItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => selectPortfolioItem(item)}
                            className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent"
                          >
                            {item.imageUrl ? (
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                                <Image
                                  src={item.imageUrl}
                                  alt={item.title || "Portfolio item"}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                  style={{
                                    objectPosition: getObjectPositionStyle(
                                      item.imageFocalPoint,
                                    ),
                                  }}
                                />
                              </div>
                            ) : item.text ? (
                              <TextThumbnail
                                text={item.text}
                                className="h-10 w-10 shrink-0 rounded-lg"
                              />
                            ) : (
                              <div className="h-10 w-10 shrink-0 rounded-lg bg-muted" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {item.title || "Untitled"}
                              </p>
                              {item.category && (
                                <span className="text-xs text-muted-foreground">
                                  {item.category}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPortfolioSelector(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
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
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                      Use from Portfolio ({portfolioItems.length} items)
                    </button>
                  )}
                </div>
              )}

            {/* Selected Portfolio Item Indicator */}
            {selectedPortfolioId && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-secondary p-3">
                <span className="text-sm text-secondary-foreground">
                  Using portfolio item
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPortfolioId(null);
                    setFormData({ title: "", text: "", imageUrl: "" });
                  }}
                  className="text-xs text-secondary-foreground transition-colors hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            )}

            <p className="mb-4 text-sm text-muted-foreground">
              Submit a photo, artwork, text, or any combination. At least one is
              required.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Title (optional)
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, title: e.target.value }));
                    if (selectedPortfolioId) setSelectedPortfolioId(null);
                  }}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Image/Artwork (optional)
                </label>
                {formData.imageUrl ? (
                  <div className="relative">
                    <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={formData.imageUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 512px"
                      />
                    </div>
                    {!selectedPortfolioId && (
                      <button
                        type="button"
                        onClick={async () => {
                          const currentUrl = formData.imageUrl;
                          setFormData((prev) => ({ ...prev, imageUrl: "" }));
                          // If this is a newly uploaded image (not the original), delete it
                          if (currentUrl && currentUrl !== originalImageUrl) {
                            await deleteImage(currentUrl);
                            setUploadedImages((prev) =>
                              prev.filter((url) => url !== currentUrl),
                            );
                          }
                        }}
                        className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
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
                      </button>
                    )}
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-8 transition-colors hover:border-foreground/20">
                    <svg
                      className="mb-2 h-8 w-8 text-muted-foreground"
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
                    <span className="text-sm text-muted-foreground">
                      {isUploading
                        ? "Uploading..."
                        : "Click to upload photo or artwork"}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
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
                      {t("watermarkEnabled")}{" "}
                      {session?.user?.id && (
                        <Link
                          href={`${getCreatorUrl({ id: session.user.id, slug: session.user.slug })}/edit`}
                          className="underline hover:text-foreground"
                        >
                          {t("changeSettings")}
                        </Link>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Text (optional)
                </label>
                <RichTextEditor
                  value={formData.text}
                  onChange={(text) => {
                    setFormData((prev) => ({ ...prev, text }));
                    if (selectedPortfolioId) setSelectedPortfolioId(null);
                  }}
                  placeholder="Write your submission..."
                />
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
                <span>{t("ownershipNotice")}</span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeSlot}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSaving ||
                    (!formData.imageUrl &&
                      !formData.text &&
                      !selectedPortfolioId)
                  }
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showClearModal}
        title="Clear All Submissions"
        message="Are you sure you want to clear all submissions for this week? This will permanently delete all your text, titles, and images. This action cannot be undone."
        confirmLabel="Clear All"
        cancelLabel="Cancel"
        onConfirm={handleClearAll}
        onCancel={() => setShowClearModal(false)}
        isLoading={isClearing}
      />
    </div>
  );
}
