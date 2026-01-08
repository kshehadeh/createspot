"use client";

import { useState } from "react";
import Link from "next/link";
import { ExpandableText } from "@/components/expandable-text";
import { SubmissionImage } from "@/components/submission-image";
import { ShareButton } from "@/components/share-button";
import { FavoriteButton } from "@/components/favorite-button";
import { FavoritesProvider } from "@/components/favorites-provider";
import { Card, CardContent } from "@/components/ui/card";

interface SubmissionDetailProps {
  submission: {
    id: string;
    title: string | null;
    imageUrl: string | null;
    text: string | null;
    wordIndex: number | null;
    category: string | null;
    tags: string[];
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

  return (
    <FavoritesProvider
      isLoggedIn={isLoggedIn}
      initialSubmissionIds={[submission.id]}
    >
      <div className="min-h-screen bg-background">
        {/* Header with title, user, and actions */}
        <Card className="rounded-none border-x-0 border-t-0">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Title and user name */}
              <div className="flex flex-col gap-1">
                <h1 className="text-xl font-bold leading-[1.3] text-foreground sm:text-2xl">
                  {submission.title || "Untitled"}
                  {submission.category && (
                    <span className="ml-2 text-base font-normal text-muted-foreground sm:text-lg">
                      ({submission.category})
                    </span>
                  )}
                </h1>
                <Link
                  href={`/profile/${submission.user.id}`}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {submission.user.name || "Anonymous"}
                </Link>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3">

                {/* Social links */}
                {(submission.user.instagram ||
                  submission.user.twitter ||
                  submission.user.linkedin ||
                  submission.user.website) && (
                  <div className="flex items-center gap-2">
                    {submission.user.instagram && (
                      <a
                        href={`https://instagram.com/${submission.user.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        aria-label={`Instagram: @${submission.user.instagram}`}
                      >
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.058-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.684-.748 1.15-.137.353-.3.882-.344 1.857-.048 1.055-.058 1.37-.058 4.041 0 2.67.01 2.986.058 4.04.045.976.207 1.505.344 1.858.182.466.399.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058 2.67 0 2.987-.01 4.04-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.684.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041 0-2.67-.01-2.986-.058-4.04-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 0 0-.748-1.15 3.098 3.098 0 0 0-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.055-.048-1.37-.058-4.041-.058zm0 3.063a5.135 5.135 0 1 1 0 10.27 5.135 5.135 0 0 1 0-10.27zm0 8.468a3.333 3.333 0 1 0 0-6.666 3.333 3.333 0 0 0 0 6.666zm6.538-8.671a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z" />
                        </svg>
                      </a>
                    )}
                    {submission.user.twitter && (
                      <a
                        href={`https://x.com/${submission.user.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        aria-label={`Twitter: @${submission.user.twitter}`}
                      >
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                    )}
                    {submission.user.linkedin && (
                      <a
                        href={`https://linkedin.com/in/${submission.user.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        aria-label={`LinkedIn: ${submission.user.linkedin}`}
                      >
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </a>
                    )}
                    {submission.user.website && (
                      <a
                        href={submission.user.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        aria-label={`Website: ${submission.user.website}`}
                      >
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}

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
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
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
        </Card>

        {/* Main content */}
        <main className="mx-auto max-w-7xl px-6 py-6">
          {/* Mobile tabs */}
          {hasBoth && (
            <div className="mb-6 flex gap-2 md:hidden">
              <button
                onClick={() => setMobileView("image")}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  mobileView === "image"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Image
              </button>
              <button
                onClick={() => setMobileView("text")}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  mobileView === "text"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
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
                className={`mb-8 ${hasBoth ? "md:col-span-2 md:mb-0 md:sticky md:top-6" : ""} ${
                  hasBoth && mobileView === "text" ? "hidden md:block" : ""
                }`}
              >
                <SubmissionImage
                  imageUrl={submission.imageUrl!}
                  alt={submission.title || "Submission"}
                  tags={submission.tags}
                />
              </div>
            )}

            {/* Text section */}
            {hasText && (
              <div
                className={`${hasBoth ? "md:col-span-1" : "mx-auto max-w-3xl"} ${
                  hasBoth && mobileView === "image" ? "hidden md:block" : ""
                }`}
              >
                <Card className="rounded-xl">
                  <CardContent className="p-6">
                    {submission.title && (
                      <h1 className="mb-4 text-2xl font-semibold text-foreground">
                        {submission.title}
                      </h1>
                    )}
                    <ExpandableText
                      text={submission.text!}
                      title={submission.title}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </FavoritesProvider>
  );
}
