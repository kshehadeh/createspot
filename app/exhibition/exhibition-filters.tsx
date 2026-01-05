"use client";

import type { FormEvent } from "react";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface ExhibitionFiltersProps {
  categories: string[];
  tags: string[];
  initialCategory?: string;
  initialTag?: string;
  initialQuery?: string;
}

export function ExhibitionFilters({
  categories,
  tags,
  initialCategory = "",
  initialTag = "",
  initialQuery = "",
}: ExhibitionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSearchValue(initialQuery);
  }, [initialQuery]);

  const hasFilters = Boolean(initialCategory || initialTag || initialQuery);

  const updateParams = (updates: {
    category?: string | null;
    tag?: string | null;
    q?: string | null;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.category !== undefined) {
      if (updates.category) {
        params.set("category", updates.category);
      } else {
        params.delete("category");
      }
    }

    if (updates.tag !== undefined) {
      if (updates.tag) {
        params.set("tag", updates.tag);
      } else {
        params.delete("tag");
      }
    }

    if (updates.q !== undefined) {
      if (updates.q) {
        params.set("q", updates.q);
      } else {
        params.delete("q");
      }
    }

    const next = params.toString();

    startTransition(() => {
      router.replace(next ? `/exhibition/gallery?${next}` : "/exhibition/gallery", {
        scroll: false,
      });
    });
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams({ q: searchValue.trim() || null });
  };

  const handleClear = () => {
    setSearchValue("");
    updateParams({ category: null, tag: null, q: null });
  };

  return (
    <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-10 py-3 text-sm text-zinc-900 shadow-inner transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-amber-700 dark:focus:ring-amber-900"
              placeholder="Search titles, tags, prompt words, or keywords"
            />
            {isPending && (
              <div className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Search
            </button>
            {hasFilters && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {categories.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Categories
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterPill
                label="All"
                isActive={!initialCategory}
                onClick={() => updateParams({ category: null })}
              />
              {categories.map((categoryName) => (
                <FilterPill
                  key={categoryName}
                  label={categoryName}
                  isActive={initialCategory === categoryName}
                  onClick={() =>
                    updateParams({
                      category:
                        initialCategory === categoryName ? null : categoryName,
                    })
                  }
                />
              ))}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Tags
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-500">
                Tap to focus on a single tag
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tagName) => (
                <FilterPill
                  key={tagName}
                  label={`#${tagName}`}
                  isActive={initialTag === tagName}
                  onClick={() =>
                    updateParams({
                      tag: initialTag === tagName ? null : tagName,
                    })
                  }
                />
              ))}
            </div>
          </div>
        )}
      </form>
    </section>
  );
}

function FilterPill({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        isActive
          ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900"
          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      }`}
    >
      {label}
    </button>
  );
}
