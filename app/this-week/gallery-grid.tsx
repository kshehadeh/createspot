"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { TextThumbnail } from "@/components/text-thumbnail";
import { SubmissionLightbox } from "@/components/submission-lightbox";
import { FavoriteButton } from "@/components/favorite-button";
import { FavoritesProvider } from "@/components/favorites-provider";

interface Submission {
  id: string;
  wordIndex: number;
  title: string | null;
  imageUrl: string | null;
  text: string | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    favorites: number;
  };
}

interface GalleryGridProps {
  submissions: Submission[];
  words: string[];
  isLoggedIn: boolean;
}

export function GalleryGrid({
  submissions,
  words,
  isLoggedIn,
}: GalleryGridProps) {
  const [filter, setFilter] = useState<number | null>(null);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);

  const filteredSubmissions = filter
    ? submissions.filter((s) => s.wordIndex === filter)
    : submissions;

  const submissionIds = submissions.map((s) => s.id);

  return (
    <FavoritesProvider
      isLoggedIn={isLoggedIn}
      initialSubmissionIds={submissionIds}
    >
      <GalleryContent
        words={words}
        isLoggedIn={isLoggedIn}
        filter={filter}
        setFilter={setFilter}
        filteredSubmissions={filteredSubmissions}
        selectedSubmission={selectedSubmission}
        setSelectedSubmission={setSelectedSubmission}
      />
    </FavoritesProvider>
  );
}

function GalleryContent({
  words,
  isLoggedIn,
  filter,
  setFilter,
  filteredSubmissions,
  selectedSubmission,
  setSelectedSubmission,
}: {
  words: string[];
  isLoggedIn: boolean;
  filter: number | null;
  setFilter: (filter: number | null) => void;
  filteredSubmissions: Submission[];
  selectedSubmission: Submission | null;
  setSelectedSubmission: (submission: Submission | null) => void;
}) {
  return (
    <div>
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setFilter(null)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            filter === null
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          All
        </motion.button>
        {words.map((word, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(index + 1)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === index + 1
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {word}
          </motion.button>
        ))}
      </div>

      <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredSubmissions.map((submission) => (
            <motion.div
              key={submission.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -4 }}
              className="cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              onClick={() => setSelectedSubmission(submission)}
            >
              {submission.imageUrl ? (
                <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={submission.imageUrl}
                    alt={submission.title || "Submission"}
                    className="h-full w-full object-cover"
                  />
                  {isLoggedIn && (
                    <FavoriteButton
                      submissionId={submission.id}
                      size="sm"
                      className="absolute top-2 right-2"
                    />
                  )}
                  {submission.text && (
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
              ) : submission.text ? (
                <div className="relative">
                  <TextThumbnail
                    text={submission.text}
                    className="aspect-square"
                  />
                  {isLoggedIn && (
                    <FavoriteButton
                      submissionId={submission.id}
                      size="sm"
                      className="absolute top-2 right-2"
                    />
                  )}
                </div>
              ) : null}
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {words[submission.wordIndex - 1]}
                  </span>
                </div>
                {submission.title && (
                  <h3 className="mb-2 font-medium text-zinc-900 dark:text-white">
                    {submission.title}
                  </h3>
                )}
                <Link
                  href={`/profile/${submission.user.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-4 flex items-center gap-2 transition-opacity hover:opacity-80"
                >
                  {submission.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={submission.user.image}
                      alt={submission.user.name || "User"}
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        {submission.user.name?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300">
                    {submission.user.name || "Anonymous"}
                  </span>
                </Link>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredSubmissions.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-zinc-600 dark:text-zinc-400"
        >
          No submissions for this word yet.
        </motion.p>
      )}

      {selectedSubmission && (
        <SubmissionLightbox
          submission={selectedSubmission}
          word={words[selectedSubmission.wordIndex - 1]}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
}
