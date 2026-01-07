"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { TextThumbnail } from "@/components/text-thumbnail";
import { SubmissionLightbox } from "@/components/submission-lightbox";
import { FavoritesProvider } from "@/components/favorites-provider";
import { FavoriteButton } from "@/components/favorite-button";

interface Favorite {
  id: string;
  submission: {
    id: string;
    wordIndex: number | null;
    title: string | null;
    imageUrl: string | null;
    text: string | null;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
    prompt: {
      word1: string;
      word2: string;
      word3: string;
    } | null;
  };
}

interface FavoritesGridProps {
  favorites: Favorite[];
}

export function FavoritesGrid({ favorites }: FavoritesGridProps) {
  const submissionIds = favorites.map((f) => f.submission.id);

  return (
    <FavoritesProvider isLoggedIn={true} initialSubmissionIds={submissionIds}>
      <FavoritesGridContent favorites={favorites} />
    </FavoritesProvider>
  );
}

function FavoritesGridContent({ favorites }: FavoritesGridProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<
    Favorite["submission"] | null
  >(null);

  const getWord = (submission: Favorite["submission"]) => {
    if (!submission.prompt || !submission.wordIndex) return "";
    const words = [
      submission.prompt.word1,
      submission.prompt.word2,
      submission.prompt.word3,
    ];
    return words[submission.wordIndex - 1];
  };

  return (
    <>
      <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {favorites.map((favorite) => (
            <motion.div
              key={favorite.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -4 }}
              className="cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              onClick={() => setSelectedSubmission(favorite.submission)}
            >
              {favorite.submission.imageUrl ? (
                <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <Image
                    src={favorite.submission.imageUrl}
                    alt={favorite.submission.title || "Submission"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <FavoriteButton
                    submissionId={favorite.submission.id}
                    size="sm"
                    className="absolute top-2 right-2"
                  />
                  {favorite.submission.text && (
                    <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm">
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
                </div>
              ) : favorite.submission.text ? (
                <div className="relative">
                  <TextThumbnail
                    text={favorite.submission.text}
                    className="aspect-square"
                  />
                  <FavoriteButton
                    submissionId={favorite.submission.id}
                    size="sm"
                    className="absolute top-2 right-2"
                  />
                </div>
              ) : null}
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {getWord(favorite.submission)}
                  </span>
                </div>
                {favorite.submission.title && (
                  <h3 className="mb-2 font-medium text-zinc-900 dark:text-white">
                    {favorite.submission.title}
                  </h3>
                )}
                <Link
                  href={`/profile/${favorite.submission.user.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-4 flex items-center gap-2 transition-opacity hover:opacity-80"
                >
                  {favorite.submission.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={favorite.submission.user.image}
                      alt={favorite.submission.user.name || "User"}
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        {favorite.submission.user.name?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300">
                    {favorite.submission.user.name || "Anonymous"}
                  </span>
                </Link>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {selectedSubmission && (
        <SubmissionLightbox
          submission={selectedSubmission}
          word={getWord(selectedSubmission)}
          onClose={() => setSelectedSubmission(null)}
          isOpen={!!selectedSubmission}
        />
      )}
    </>
  );
}
