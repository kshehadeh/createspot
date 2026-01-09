"use client";

import { useState } from "react";
import Link from "next/link";
import { ExpandableText } from "@/components/expandable-text";
import { SubmissionImage } from "@/components/submission-image";
import { SubmissionLightbox } from "@/components/submission-lightbox";
import { Card, CardContent } from "@/components/ui/card";

interface FeaturedSubmissionProps {
  submission: {
    id: string;
    title: string | null;
    imageUrl: string | null;
    text: string | null;
    wordIndex: number | null;
    prompt: {
      word1: string;
      word2: string;
      word3: string;
    } | null;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
    _count: {
      favorites: number;
    };
  };
}

export function FeaturedSubmission({ submission }: FeaturedSubmissionProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const hasImage = !!submission.imageUrl;
  const hasText = !!submission.text;
  const word =
    submission.prompt && submission.wordIndex
      ? [
          submission.prompt.word1,
          submission.prompt.word2,
          submission.prompt.word3,
        ][submission.wordIndex - 1]
      : "";

  return (
    <>
      {/* Image section */}
      {hasImage && (
        <div className="mb-6">
          <SubmissionImage
            imageUrl={submission.imageUrl!}
            alt={submission.title || word || "Featured"}
            heightClasses="h-[50vh] sm:h-[60vh] md:h-[65vh]"
            onExpand={() => setIsLightboxOpen(true)}
          />
        </div>
      )}

      {/* Text and metadata section */}
      {(hasText || (submission.prompt && submission.wordIndex)) && (
        <Card className="rounded-xl">
          <CardContent className="p-6">
            {/* Text section */}
            {hasText && (
              <div className="mb-4">
                {submission.title && (
                  <h3 className="mb-3 text-lg font-semibold text-foreground">
                    {submission.title}
                  </h3>
                )}
                <ExpandableText
                  text={submission.text!}
                  title={submission.title}
                />
              </div>
            )}

            {/* Link to full submission */}
            <div
              className={`flex flex-col gap-3 ${
                hasText ? "border-t border-border pt-4" : ""
              }`}
            >
              {submission.prompt && submission.wordIndex && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-muted-foreground">Prompt:</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      submission.prompt.word1,
                      submission.prompt.word2,
                      submission.prompt.word3,
                    ].map((promptWord, index) => {
                      const isActive = index + 1 === submission.wordIndex;
                      return (
                        <span
                          key={index}
                          className={`text-sm font-medium ${
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground/50"
                          }`}
                        >
                          {promptWord}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              <Link
                href={`/s/${submission.id}`}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View full submission →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Link only (when no text and no prompt) */}
      {!hasText && !(submission.prompt && submission.wordIndex) && (
        <div>
          <Link
            href={`/s/${submission.id}`}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View full submission →
          </Link>
        </div>
      )}

      {/* Lightbox */}
      {hasImage && (
        <SubmissionLightbox
          submission={{
            id: submission.id,
            title: submission.title,
            imageUrl: submission.imageUrl,
            text: submission.text,
            user: submission.user,
            _count: submission._count,
          }}
          word={word}
          onClose={() => setIsLightboxOpen(false)}
          isOpen={isLightboxOpen}
        />
      )}
    </>
  );
}
