"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/rich-text-editor";
import { ConfirmModal } from "@/components/confirm-modal";
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
import { CATEGORIES } from "@/lib/categories";

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

interface SubmissionData {
  id: string;
  title: string | null;
  imageUrl: string | null;
  text: string | null;
  tags: string[];
  category: string | null;
  shareStatus?: "PRIVATE" | "PROFILE" | "PUBLIC";
}

interface PortfolioItemFormProps {
  mode: "create" | "edit";
  initialData?: SubmissionData;
  onSuccess?: (data?: SubmissionData) => void;
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
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState(initialData?.category || "");
  const [shareStatus, setShareStatus] = useState<
    "PRIVATE" | "PROFILE" | "PUBLIC"
  >(initialData?.shareStatus || "PUBLIC");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRemoveImageConfirm, setShowRemoveImageConfirm] = useState(false);

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
            text: text || null,
            isPortfolio: true,
            tags: trimmedTags,
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
            tags: trimmedTags,
            category: category || null,
            shareStatus,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update portfolio item");
        }
      }

      if (onSuccess) {
        // Pass the updated data back for edit mode
        const updatedData: SubmissionData | undefined = initialData
          ? {
              id: initialData.id,
              title: title || null,
              imageUrl: imageUrl || null,
              text: text || null,
              tags: trimmedTags,
              category: category || null,
              shareStatus,
            }
          : undefined;
        onSuccess(updatedData);
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
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your work a title"
        />
      </div>

      <div>
        <Label>Image</Label>
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
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => setShowRemoveImageConfirm(true)}
              className="absolute top-2 right-2"
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
                <span className="text-sm text-muted-foreground">Uploading...</span>
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
                  Click to upload an image
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  PNG, JPG, GIF up to 10MB
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <div>
        <Label>Text / Description</Label>
        <RichTextEditor
          value={text}
          onChange={setText}
          placeholder="Add a description or creative writing..."
        />
      </div>

      <div>
        <Label>Category</Label>
        <Select
          value={category || "__none__"}
          onValueChange={(value) => setCategory(value === "__none__" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Tags</Label>
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
                aria-label={`Remove ${tag}`}
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
            placeholder={tags.length === 0 ? "Type a tag and press space" : ""}
            className="flex-1 min-w-[120px] border-0 bg-transparent px-0 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Type a tag and press space to add it
        </p>
      </div>

      <div>
        <Label>Visibility</Label>
        <div className="space-y-2">
          {SHARE_STATUS_OPTIONS.map((option) => (
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

      <div className="flex gap-3">
        <Button type="submit" disabled={saving || uploading}>
          {saving
            ? "Saving..."
            : mode === "create"
              ? "Add to Portfolio"
              : "Save Changes"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      {/* Remove Image Confirmation Modal */}
      <ConfirmModal
        isOpen={showRemoveImageConfirm}
        title="Remove Image"
        message="Are you sure you want to remove this image from your submission? This action cannot be undone."
        confirmLabel="Remove"
        onConfirm={() => {
          handleRemoveImage();
          setShowRemoveImageConfirm(false);
        }}
        onCancel={() => setShowRemoveImageConfirm(false)}
      />
    </form>
  );
}
