"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignInButton } from "./auth-button";
import { SubmissionLightbox } from "./submission-lightbox";
import { TextThumbnail } from "./text-thumbnail";
import { FavoriteButton } from "./favorite-button";
import { FavoritesProvider } from "./favorites-provider";

interface AnimatedHeroProps {
  words: string[];
}

export function AnimatedHero({ words }: AnimatedHeroProps) {
  return (
    <section className="mb-16 text-center">
      <motion.p
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4 text-sm uppercase tracking-widest text-zinc-500 dark:text-zinc-400"
      >
        This week&apos;s prompt
      </motion.p>
      <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
        {words.map((word, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.6,
              delay: index * 0.15,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={{
              scale: 1.05,
              transition: { duration: 0.2 },
            }}
            className={`inline-block text-4xl font-bold leading-[1.3] text-zinc-900 dark:text-white sm:text-6xl sm:leading-[1.3] rainbow-shimmer-${index + 1}`}
          >
            {word}
          </motion.span>
        ))}
      </div>
    </section>
  );
}

interface AnimatedCtaProps {
  isLoggedIn: boolean;
}

export function AnimatedCta({ isLoggedIn }: AnimatedCtaProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="mb-12"
    >
      {isLoggedIn ? (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link
            href="/play"
            className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Play this week
          </Link>
        </motion.div>
      ) : (
        <SignInButton />
      )}
    </motion.section>
  );
}

interface Submission {
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
  _count: {
    favorites: number;
  };
}

interface AnimatedGalleryProps {
  submissions: Submission[];
  words: string[];
  isLoggedIn: boolean;
}

export function AnimatedGallery({
  submissions,
  words,
  isLoggedIn,
}: AnimatedGalleryProps) {
  const submissionIds = submissions.map((s) => s.id);

  return (
    <FavoritesProvider
      isLoggedIn={isLoggedIn}
      initialSubmissionIds={submissionIds}
    >
      <AnimatedGalleryContent
        submissions={submissions}
        words={words}
        isLoggedIn={isLoggedIn}
      />
    </FavoritesProvider>
  );
}

function AnimatedGalleryContent({
  submissions,
  words,
  isLoggedIn,
}: {
  submissions: Submission[];
  words: string[];
  isLoggedIn: boolean;
}) {
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const router = useRouter();

  return (
    <>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="w-full max-w-4xl"
      >
        <h3 className="mb-6 text-center text-lg font-medium text-zinc-900 dark:text-white">
          Recent submissions
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {submissions.map((submission, index) => (
            <motion.div
              key={submission.id}
              onClick={() => router.push(`/s/${submission.id}`)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.9 + index * 0.1,
              }}
              whileHover={{
                scale: 1.03,
                transition: { duration: 0.2 },
              }}
              className="relative aspect-square overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800 cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/s/${submission.id}`);
                }
              }}
              aria-label={`View submission: ${submission.title || "Untitled"}`}
            >
              {submission.imageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={submission.imageUrl}
                    alt={submission.title || "Submission"}
                    className="h-full w-full object-cover"
                  />
                  {submission.wordIndex && (
                    <div className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {words[submission.wordIndex - 1]}
                    </div>
                  )}
                  {isLoggedIn && (
                    <FavoriteButton
                      submissionId={submission.id}
                      size="sm"
                      className="absolute top-2 right-2"
                    />
                  )}
                  {submission.text && (
                    <div className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-md bg-black/60 backdrop-blur-sm">
                      <svg
                        className="h-3 w-3 text-white"
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
                </>
              ) : submission.text ? (
                <div className="relative h-full w-full">
                  <TextThumbnail
                    text={submission.text}
                    className="h-full w-full"
                  />
                  {submission.wordIndex && (
                    <div className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {words[submission.wordIndex - 1]}
                    </div>
                  )}
                  {isLoggedIn && (
                    <FavoriteButton
                      submissionId={submission.id}
                      size="sm"
                      className="absolute top-2 right-2"
                    />
                  )}
                </div>
              ) : (
                <div className="relative flex h-full items-center justify-center p-4">
                  <p className="line-clamp-4 text-sm text-zinc-600 dark:text-zinc-400">
                    {submission.title || "Untitled"}
                  </p>
                  {submission.wordIndex && (
                    <div className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {words[submission.wordIndex - 1]}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.section>

      {selectedSubmission && (
        <SubmissionLightbox
          submission={selectedSubmission}
          word={
            selectedSubmission.wordIndex
              ? words[selectedSubmission.wordIndex - 1]
              : ""
          }
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </>
  );
}

export function AnimatedHowItWorks() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 }}
      className="mb-12 max-w-xl text-center"
    >
      <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-white">
        How it works
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400">
        Each week, we share three words. Pick one (or more!) and create a photo,
        artwork, or text inspired by it. Share your creation and see how others
        bring the same words to life.
      </p>
    </motion.section>
  );
}
