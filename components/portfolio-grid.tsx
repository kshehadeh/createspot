"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TextThumbnail } from "@/components/text-thumbnail";
import { FavoriteButton } from "@/components/favorite-button";
import { FavoritesProvider } from "@/components/favorites-provider";

interface PortfolioItem {
  id: string;
  title: string | null;
  imageUrl: string | null;
  text: string | null;
  isPortfolio: boolean;
  tags: string[];
  category: string | null;
  promptId: string | null;
  wordIndex: number | null;
  prompt: {
    word1: string;
    word2: string;
    word3: string;
  } | null;
  _count: {
    favorites: number;
  };
}

interface PortfolioGridProps {
  items: PortfolioItem[];
  isLoggedIn: boolean;
  isOwnProfile?: boolean;
  showPromptBadge?: boolean;
}

export function PortfolioGrid({
  items,
  isLoggedIn,
  isOwnProfile = false,
  showPromptBadge = true,
}: PortfolioGridProps) {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Get unique categories
  const categories = Array.from(
    new Set(
      items.filter((item) => item.category).map((item) => item.category!),
    ),
  );

  const filteredItems = categoryFilter
    ? items.filter((item) => item.category === categoryFilter)
    : items;

  const submissionIds = items.map((s) => s.id);

  return (
    <FavoritesProvider
      isLoggedIn={isLoggedIn}
      initialSubmissionIds={submissionIds}
    >
      <PortfolioGridContent
        items={filteredItems}
        categories={categories}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        isLoggedIn={isLoggedIn}
        isOwnProfile={isOwnProfile}
        showPromptBadge={showPromptBadge}
      />
    </FavoritesProvider>
  );
}

function PortfolioGridContent({
  items,
  categories,
  categoryFilter,
  setCategoryFilter,
  isLoggedIn,
  isOwnProfile,
  showPromptBadge,
}: {
  items: PortfolioItem[];
  categories: string[];
  categoryFilter: string | null;
  setCategoryFilter: (category: string | null) => void;
  isLoggedIn: boolean;
  isOwnProfile: boolean;
  showPromptBadge: boolean;
}) {
  const router = useRouter();

  return (
    <div>
      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCategoryFilter(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              categoryFilter === null
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            All
          </motion.button>
          {categories.map((category) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCategoryFilter(category)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                categoryFilter === category
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>
      )}

      <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -4 }}
              className="group cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              onClick={() => router.push(`/s/${item.id}`)}
            >
              {item.imageUrl ? (
                <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.title || "Portfolio item"}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {isLoggedIn && (
                    <FavoriteButton
                      submissionId={item.id}
                      size="sm"
                      className="absolute top-2 right-2"
                    />
                  )}
                  {item.text && (
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
              ) : item.text ? (
                <div className="relative">
                  <TextThumbnail text={item.text} className="aspect-square" />
                  {isLoggedIn && (
                    <FavoriteButton
                      submissionId={item.id}
                      size="sm"
                      className="absolute top-2 right-2"
                    />
                  )}
                </div>
              ) : null}
              <div className="p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {item.category && (
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {item.category}
                    </span>
                  )}
                  {showPromptBadge && item.promptId && item.prompt && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {item.wordIndex
                        ? [
                            item.prompt.word1,
                            item.prompt.word2,
                            item.prompt.word3,
                          ][item.wordIndex - 1]
                        : "Prompt"}
                    </span>
                  )}
                </div>
                {item.title && (
                  <h3 className="mb-2 font-medium text-zinc-900 dark:text-white">
                    {item.title}
                  </h3>
                )}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs text-zinc-500 dark:text-zinc-500"
                      >
                        #{tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="text-xs text-zinc-400 dark:text-zinc-600">
                        +{item.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {items.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-700"
        >
          <p className="text-zinc-500 dark:text-zinc-400">
            {isOwnProfile
              ? "No portfolio items yet. Add your creative work to showcase it here."
              : "No portfolio items to display."}
          </p>
          {isOwnProfile && (
            <Link
              href="/profile/edit"
              className="mt-4 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Add Portfolio Item
            </Link>
          )}
        </motion.div>
      )}
    </div>
  );
}
