"use client";

import { useState } from "react";
import Image from "next/image";
import { TextThumbnail } from "@/components/text-thumbnail";
import { SubmissionLightbox } from "@/components/submission-lightbox";
import { getObjectPositionStyle } from "@/lib/image-utils";

interface FeaturedSubmissionProps {
  submission: {
    id: string;
    title: string | null;
    imageUrl: string | null;
    imageFocalPoint?: { x: number; y: number } | null;
    text: string | null;
    wordIndex: number | null;
    prompt: {
      word1: string;
      word2: string;
      word3: string;
    } | null;
    shareStatus: "PRIVATE" | "PROFILE" | "PUBLIC";
    critiquesEnabled: boolean;
    user: {
      id: string;
      name: string | null;
      image: string | null;
      slug?: string | null;
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
        <div
          className="group relative aspect-square w-full cursor-pointer overflow-hidden bg-muted"
          onClick={() => setIsLightboxOpen(true)}
        >
          <Image
            src={submission.imageUrl!}
            alt={submission.title || word || "Featured"}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 33vw"
            style={{
              objectPosition: getObjectPositionStyle(
                submission.imageFocalPoint,
              ),
            }}
          />
          {hasText && (
            <div className="absolute left-2 bottom-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </div>
          )}
          {/* Hover overlay with creator name and title */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/80 via-black/60 to-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="px-4 text-center">
              <h3 className="mb-2 text-lg font-semibold text-white drop-shadow-lg">
                {submission.title || "Untitled"}
              </h3>
              <p className="text-sm font-medium text-white/90 drop-shadow-md">
                {submission.user.name || "Anonymous"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Text-only submission */}
      {!hasImage && hasText && (
        <div
          className="group relative aspect-square w-full cursor-pointer overflow-hidden bg-muted"
          onClick={() => setIsLightboxOpen(true)}
        >
          <TextThumbnail
            text={submission.text!}
            className="h-full w-full"
            fadeBottom
          />
          {/* Hover overlay with creator name and title */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/80 via-black/60 to-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="px-4 text-center">
              <h3 className="mb-2 text-lg font-semibold text-white drop-shadow-lg">
                {submission.title || "Untitled"}
              </h3>
              <p className="text-sm font-medium text-white/90 drop-shadow-md">
                {submission.user.name || "Anonymous"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {(hasImage || hasText) && (
        <SubmissionLightbox
          submission={{
            id: submission.id,
            title: submission.title,
            imageUrl: submission.imageUrl,
            text: submission.text,
            shareStatus: submission.shareStatus,
            critiquesEnabled: submission.critiquesEnabled,
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
