"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
}

interface GalleryGridProps {
  submissions: Submission[];
  words: string[];
}

export function GalleryGrid({ submissions, words }: GalleryGridProps) {
  const [filter, setFilter] = useState<number | null>(null);

  const filteredSubmissions = filter
    ? submissions.filter((s) => s.wordIndex === filter)
    : submissions;

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
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            >
              {submission.imageUrl && (
                <div className="aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={submission.imageUrl}
                    alt={submission.title || "Submission"}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
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
                {submission.text && (
                  <div
                    className="prose prose-sm dark:prose-invert line-clamp-3 text-zinc-600 dark:text-zinc-400"
                    dangerouslySetInnerHTML={{ __html: submission.text }}
                  />
                )}
                <div className="mt-4 flex items-center gap-2">
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
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {submission.user.name || "Anonymous"}
                  </span>
                </div>
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
    </div>
  );
}
