"use client";

import { useState } from "react";
import Link from "next/link";
import { ExpandableImage } from "@/components/expandable-image";
import { ExpandableText } from "@/components/expandable-text";
import { ShareButton } from "@/components/share-button";
import { FavoriteButton } from "@/components/favorite-button";
import { SocialLinks } from "@/app/profile/[userId]/social-links";
import { FavoritesProvider } from "@/components/favorites-provider";

interface SubmissionDetailProps {
  submission: {
    id: string;
    title: string | null;
    imageUrl: string | null;
    text: string | null;
    wordIndex: number | null;
    user: {
      id: string;
      name: string | null;
      image: string | null;
      bio: string | null;
      instagram: string | null;
      twitter: string | null;
      linkedin: string | null;
      website: string | null;
    };
    prompt: {
      id: string;
      word1: string;
      word2: string;
      word3: string;
    } | null;
    _count: {
      favorites: number;
    };
  };
  isLoggedIn: boolean;
}

export function SubmissionDetail({
  submission,
  isLoggedIn,
}: SubmissionDetailProps) {
  const [mobileView, setMobileView] = useState<"image" | "text">("image");
  const hasImage = !!submission.imageUrl;
  const hasText = !!submission.text;
  const hasBoth = hasImage && hasText;
  const hasPrompt = !!submission.prompt && !!submission.wordIndex;

  return (
    <FavoritesProvider
      isLoggedIn={isLoggedIn}
      initialSubmissionIds={[submission.id]}
    >
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        {/* Header with prompt and actions */}
        <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Prompt words or portfolio label */}
              <div className="flex flex-wrap items-center gap-3">
                {hasPrompt ? (
                  [
                    submission.prompt!.word1,
                    submission.prompt!.word2,
                    submission.prompt!.word3,
                  ].map((promptWord, index) => {
                    const isActive = index + 1 === submission.wordIndex;
                    return (
                      <span
                        key={index}
                        className={`inline-block text-xl font-bold leading-[1.3] sm:text-2xl ${
                          isActive
                            ? `rainbow-shimmer-${index + 1} text-zinc-900 dark:text-white`
                            : "text-zinc-400 dark:text-zinc-600"
                        }`}
                      >
                        {promptWord}
                      </span>
                    );
                  })
                ) : (
                  <span className="inline-block text-xl font-bold leading-[1.3] text-zinc-900 dark:text-white sm:text-2xl">
                    Portfolio Piece
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <ShareButton
                  submissionId={submission.id}
                  title={submission.title}
                />
                {isLoggedIn && (
                  <FavoriteButton submissionId={submission.id} size="md" />
                )}
                {submission._count.favorites > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                    <svg
                      className="h-5 w-5 text-red-500"
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
                    <span>{submission._count.favorites}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="mx-auto max-w-7xl px-6 py-6">
          {/* Mobile tabs */}
          {hasBoth && (
            <div className="mb-6 flex gap-2 md:hidden">
              <button
                onClick={() => setMobileView("image")}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  mobileView === "image"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                Image
              </button>
              <button
                onClick={() => setMobileView("text")}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  mobileView === "text"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                Text
              </button>
            </div>
          )}

          {/* Content layout */}
          <div
            className={`mb-12 ${hasBoth ? "md:grid md:grid-cols-3 md:gap-8" : ""}`}
          >
            {/* Image section */}
            {hasImage && (
              <div
                className={`mb-8 ${hasBoth ? "md:col-span-2 md:mb-0" : ""} ${
                  hasBoth && mobileView === "text" ? "hidden md:block" : ""
                }`}
              >
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <ExpandableImage
                    imageUrl={submission.imageUrl!}
                    alt={submission.title || "Submission"}
                    className="min-h-[400px]"
                  />
                </div>
              </div>
            )}

            {/* Text section */}
            {hasText && (
              <div
                className={`${hasBoth ? "md:col-span-1" : "max-w-3xl"} ${
                  hasBoth && mobileView === "image" ? "hidden md:block" : ""
                }`}
              >
                <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                  {submission.title && (
                    <h1 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-white">
                      {submission.title}
                    </h1>
                  )}
                  <ExpandableText
                    text={submission.text!}
                    title={submission.title}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Creator profile section */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center gap-4">
              {submission.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={submission.user.image}
                  alt={submission.user.name || "User"}
                  className="h-16 w-16 rounded-full"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <span className="text-2xl font-medium text-zinc-600 dark:text-zinc-400">
                    {submission.user.name?.charAt(0) || "?"}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <Link
                  href={`/profile/${submission.user.id}`}
                  className="text-xl font-semibold text-zinc-900 transition-colors hover:text-zinc-700 dark:text-white dark:hover:text-zinc-300"
                >
                  {submission.user.name || "Anonymous"}
                </Link>
              </div>
            </div>

            {submission.user.bio && (
              <div
                className="prose prose-sm dark:prose-invert mb-4 max-w-none text-zinc-700 dark:text-zinc-300"
                dangerouslySetInnerHTML={{ __html: submission.user.bio }}
              />
            )}

            {(submission.user.instagram ||
              submission.user.twitter ||
              submission.user.linkedin ||
              submission.user.website) && (
              <SocialLinks
                instagram={submission.user.instagram}
                twitter={submission.user.twitter}
                linkedin={submission.user.linkedin}
                website={submission.user.website}
              />
            )}
          </div>
        </main>
      </div>
    </FavoritesProvider>
  );
}
