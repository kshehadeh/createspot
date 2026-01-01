"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Submission } from "@/app/generated/prisma/client";
import { RichTextEditor } from "@/components/rich-text-editor";
import { TextThumbnail } from "@/components/text-thumbnail";
import { ConfirmModal } from "@/components/confirm-modal";

interface SubmissionSlotsProps {
  promptId: string;
  words: string[];
  existingSubmissions: Record<number, Submission>;
}

export function SubmissionSlots({
  promptId,
  words,
  existingSubmissions,
}: SubmissionSlotsProps) {
  const router = useRouter();
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const [formData, setFormData] = useState<{
    title: string;
    text: string;
    imageUrl: string;
  }>({ title: "", text: "", imageUrl: "" });

  function openSlot(wordIndex: number) {
    const existing = existingSubmissions[wordIndex];
    setFormData({
      title: existing?.title || "",
      text: existing?.text || "",
      imageUrl: existing?.imageUrl || "",
    });
    setActiveSlot(wordIndex);
    setError(null);
  }

  function closeSlot() {
    setActiveSlot(null);
    setFormData({ title: "", text: "", imageUrl: "" });
    setError(null);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation before upload
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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
        `File is too large (${fileSizeMB} MB). Maximum file size is 10 MB. Please choose a smaller image.`,
      );
      // Reset the file input
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const { imageUrl } = await response.json();
      setFormData((prev) => ({ ...prev, imageUrl }));
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

    try {
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

      closeSlot();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClearAll() {
    setIsClearing(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/submissions?promptId=${promptId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to clear submissions");
      }

      setShowClearModal(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear submissions");
    } finally {
      setIsClearing(false);
    }
  }

  const hasAnySubmissions = Object.keys(existingSubmissions).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
          Your submissions
        </h2>
        {hasAnySubmissions && (
          <button
            onClick={() => setShowClearModal(true)}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {words.map((word, index) => {
          const wordIndex = index + 1;
          const submission = existingSubmissions[wordIndex];

          return (
            <div
              key={wordIndex}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h3 className="mb-4 text-center text-lg font-semibold text-zinc-900 dark:text-white">
                {word}
              </h3>

              {submission ? (
                <div className="space-y-4">
                  {submission.imageUrl ? (
                    <div className="aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={submission.imageUrl}
                        alt={submission.title || word}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : submission.text ? (
                    <TextThumbnail
                      text={submission.text}
                      className="aspect-square rounded-lg"
                    />
                  ) : null}
                  {submission.title && (
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {submission.title}
                    </p>
                  )}
                  <button
                    onClick={() => openSlot(wordIndex)}
                    className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => openSlot(wordIndex)}
                  className="flex aspect-square w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
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
          );
        })}
      </div>

      {activeSlot !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onClick={closeSlot}
        >
          <div
            className="my-auto w-full max-w-lg rounded-xl bg-white p-6 dark:bg-zinc-900 max-h-[calc(100vh-2rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                {existingSubmissions[activeSlot]
                  ? "Edit submission"
                  : "New submission"}{" "}
                for &quot;{words[activeSlot - 1]}&quot;
              </h3>
              <button
                onClick={closeSlot}
                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
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
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
              Submit a photo, artwork, text, or any combination. At least one
              is required.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Title (optional)
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Image/Artwork (optional)
                </label>
                {formData.imageUrl ? (
                  <div className="relative">
                    <div className="aspect-video overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, imageUrl: "" }))
                      }
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
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 py-8 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600">
                    <svg
                      className="mb-2 h-8 w-8 text-zinc-400"
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
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
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
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Text (optional)
                </label>
                <RichTextEditor
                  value={formData.text}
                  onChange={(text) =>
                    setFormData((prev) => ({ ...prev, text }))
                  }
                  placeholder="Write your submission..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeSlot}
                  className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || (!formData.imageUrl && !formData.text)}
                  className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
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
