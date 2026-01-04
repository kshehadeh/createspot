"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/rich-text-editor";

const CATEGORIES = [
  "Photography",
  "Writing",
  "Digital Art",
  "Illustration",
  "Mixed Media",
  "Design",
  "Other",
];

const SHARE_STATUS_OPTIONS = [
  {
    value: "PUBLIC",
    label: "Public",
    description: "Visible everywhere (galleries, profile pages, etc.)",
  },
  {
    value: "PROFILE",
    label: "Profile Only",
    description: "Only visible on your profile page",
  },
  {
    value: "PRIVATE",
    label: "Private",
    description: "Only visible to you",
  },
];

interface PortfolioItemFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    title: string | null;
    imageUrl: string | null;
    text: string | null;
    tags: string[];
    category: string | null;
    shareStatus?: "PRIVATE" | "PROFILE" | "PUBLIC";
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PortfolioItemForm({
  mode,
  initialData,
  onSuccess,
  onCancel,
}: PortfolioItemFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialData?.title || "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [text, setText] = useState(initialData?.text || "");
  const [tagsInput, setTagsInput] = useState(
    initialData?.tags?.join(", ") || "",
  );
  const [category, setCategory] = useState(initialData?.category || "");
  const [shareStatus, setShareStatus] = useState<
    "PRIVATE" | "PROFILE" | "PUBLIC"
  >(initialData?.shareStatus || "PUBLIC");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be less than 10MB");
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
        }),
      });

      if (!presignResponse.ok) {
        const data = await presignResponse.json().catch(() => null);
        throw new Error(data?.error || "Failed to get upload URL");
      }

      const { presignedUrl, publicUrl } = await presignResponse.json();

      // Upload to R2
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      setImageUrl(publicUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload image. Please try again.",
      );
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageUrl && !text) {
      setError("Please add an image or text");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      if (mode === "create") {
        const response = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title || null,
            imageUrl: imageUrl || null,
            text: text || null,
            isPortfolio: true,
            tags,
            category: category || null,
            shareStatus,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create portfolio item");
        }
      } else if (initialData) {
        const response = await fetch(`/api/submissions/${initialData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title || null,
            imageUrl: imageUrl || null,
            text: text || null,
            tags,
            category: category || null,
            shareStatus,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update portfolio item");
        }
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch {
      setError("Failed to save portfolio item. Please try again.");
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
        <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-white">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your work a title"
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-zinc-500"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-white">
          Image
        </label>
        {imageUrl ? (
          <div className="relative">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Preview"
                className="h-full w-full object-contain"
              />
            </div>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 rounded-lg bg-red-500 p-1.5 text-white transition-colors hover:bg-red-600"
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
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer rounded-lg border-2 border-dashed border-zinc-300 p-8 text-center transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
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
                  className="h-5 w-5 animate-spin text-zinc-500"
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
                <span className="text-sm text-zinc-500">Uploading...</span>
              </div>
            ) : (
              <>
                <svg
                  className="mx-auto h-8 w-8 text-zinc-400"
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
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Click to upload an image
                </p>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-white">
          Text / Description
        </label>
        <RichTextEditor
          value={text}
          onChange={setText}
          placeholder="Add a description or creative writing..."
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-white">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-zinc-500"
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-white">
          Tags
        </label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="landscape, nature, minimal (comma-separated)"
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-zinc-500"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Separate tags with commas
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-white">
          Visibility
        </label>
        <div className="space-y-2">
          {SHARE_STATUS_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                shareStatus === option.value
                  ? "border-zinc-900 bg-zinc-50 dark:border-zinc-300 dark:bg-zinc-800"
                  : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
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
                <div className="text-sm font-medium text-zinc-900 dark:text-white">
                  {option.label}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {option.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {saving
            ? "Saving..."
            : mode === "create"
              ? "Add to Portfolio"
              : "Save Changes"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
