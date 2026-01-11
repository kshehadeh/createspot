"use client";

import type { FormEvent } from "react";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CreatorsFiltersProps {
  initialQuery?: string;
}

export function CreatorsFilters({ initialQuery = "" }: CreatorsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSearchValue(initialQuery);
  }, [initialQuery]);

  const hasFilters = Boolean(initialQuery);

  const updateParams = (updates: { q?: string | null }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.q !== undefined) {
      if (updates.q) {
        params.set("q", updates.q);
      } else {
        params.delete("q");
      }
    }

    const next = params.toString();
    const basePath = pathname || "/creators";

    startTransition(() => {
      router.replace(next ? `${basePath}?${next}` : basePath, {
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
    updateParams({ q: null });
  };

  return (
    <Card className="mb-8 rounded-2xl border-0 shadow-none">
      <CardContent className="px-0 py-6">
        <form onSubmit={handleSearch}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
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
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className="h-10 w-full rounded-xl pl-10 pr-10 shadow-inner"
                placeholder="Search creators by name, bio, location..."
              />
              {isPending && (
                <div className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="rounded-xl">
                Search
              </Button>
              {mounted && (
                <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl gap-2"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        />
                      </svg>
                      Filters
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 rounded-xl p-4" align="end">
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      Filters coming soon
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              {!mounted && (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl gap-2"
                  disabled
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  Filters
                </Button>
              )}
              {hasFilters && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="rounded-xl"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
