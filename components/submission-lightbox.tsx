"use client";

import { useState, useEffect } from "react";

interface LightboxSubmission {
  id: string;
  title: string | null;
  imageUrl: string | null;
  text: string | null;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count?: {
    favorites: number;
  };
}

interface SubmissionLightboxProps {
  submission: LightboxSubmission;
  word: string;
  onClose: () => void;
}

export function SubmissionLightbox({
  submission,
  word,
  onClose,
}: SubmissionLightboxProps) {
  const [mobileView, setMobileView] = useState<"image" | "text">("image");
  const hasImage = !!submission.imageUrl;
  const hasText = !!submission.text;
  const hasBoth = hasImage && hasText;

  // Get favorite count - handle both _count and direct favoriteCount
  const favoriteCount =
    submission._count?.favorites ?? (submission as any).favoriteCount ?? 0;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
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

      {/* Mobile view with tabs */}
      {hasBoth && (
        <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 gap-2 md:hidden">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMobileView("image");
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              mobileView === "image"
                ? "bg-white text-zinc-900"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            Image
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMobileView("text");
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              mobileView === "text"
                ? "bg-white text-zinc-900"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            Text
          </button>
        </div>
      )}

      <div
        className="flex h-full w-full max-w-7xl flex-col p-4 md:flex-row md:items-center md:gap-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image section */}
        {hasImage && (
          <div
            className={`flex flex-1 items-center justify-center ${
              hasBoth ? "md:w-2/3" : "w-full"
            } ${hasBoth && mobileView === "text" ? "hidden md:flex" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={submission.imageUrl!}
              alt={submission.title || "Submission"}
              className="max-h-[80vh] max-w-full rounded-lg object-contain"
            />
          </div>
        )}

        {/* Text section */}
        {hasText && (
          <div
            className={`flex flex-col overflow-hidden ${
              hasBoth ? "md:w-1/3" : "w-full max-w-2xl"
            } ${hasBoth && mobileView === "image" ? "hidden md:flex" : ""} ${
              !hasImage ? "mx-auto" : ""
            }`}
          >
            <div className="max-h-[80vh] overflow-y-auto rounded-xl bg-white p-6 dark:bg-zinc-900">
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {word}
                </span>
                {favoriteCount > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                    <svg
                      className="h-4 w-4 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span>{favoriteCount}</span>
                  </div>
                )}
              </div>
              {submission.title && (
                <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
                  {submission.title}
                </h2>
              )}
              <div
                className="prose prose-zinc dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: submission.text! }}
              />
              {submission.user && (
                <div className="mt-6 flex items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  {submission.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={submission.user.image}
                      alt={submission.user.name || "User"}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        {submission.user.name?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {submission.user.name || "Anonymous"}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Image-only metadata overlay */}
        {hasImage && !hasText && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-xl bg-black/70 px-6 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium text-white">
                {word}
              </span>
              {submission.title && (
                <span className="text-white">{submission.title}</span>
              )}
              {favoriteCount > 0 && (
                <div className="flex items-center gap-1.5 text-white">
                  <svg
                    className="h-4 w-4 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span className="text-sm">{favoriteCount}</span>
                </div>
              )}
              {submission.user && (
                <>
                  <span className="text-zinc-400">by</span>
                  <span className="text-white">
                    {submission.user.name || "Anonymous"}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
