"use client";

import type { FormEvent } from "react";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExhibitFiltersProps {
  curators: Array<{
    id: string;
    name: string | null;
  }>;
  initialCurator?: string;
  initialStatus?: string;
  initialQuery?: string;
}

export function ExhibitFilters({
  curators,
  initialCurator = "",
  initialStatus = "",
  initialQuery = "",
}: ExhibitFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const t = useTranslations("admin.exhibits");
  const tProfile = useTranslations("profile");
  const [searchValue, setSearchValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    setSearchValue(initialQuery);
  }, [initialQuery]);

  const hasFilters = Boolean(initialCurator || initialStatus || initialQuery);

  const updateParams = (updates: {
    curator?: string | null;
    status?: string | null;
    q?: string | null;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.curator !== undefined) {
      if (updates.curator) {
        params.set("curator", updates.curator);
      } else {
        params.delete("curator");
      }
    }

    if (updates.status !== undefined) {
      if (updates.status) {
        params.set("status", updates.status);
      } else {
        params.delete("status");
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
    const basePath = pathname || "/admin/exhibits";

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
    updateParams({ curator: null, status: null, q: null });
  };

  const activeFiltersCount = (initialCurator ? 1 : 0) + (initialStatus ? 1 : 0);

  return (
    <Card className="mb-8 rounded-2xl border-0 shadow-none">
      <CardContent className="p-6">
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
                placeholder={t("searchPlaceholder")}
              />
              {isPending && (
                <div className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="rounded-xl">
                {t("search")}
              </Button>
              <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={`rounded-xl gap-2 ${
                      activeFiltersCount > 0
                        ? "border-[hsl(var(--filter-active))] bg-[hsl(var(--filter-active-background))] text-[hsl(var(--filter-active-foreground))] hover:bg-[hsl(var(--filter-active-hover))]"
                        : ""
                    }`}
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
                    {t("filters")}
                    {activeFiltersCount > 0 && (
                      <Badge className="ml-1 bg-[hsl(var(--filter-active))] text-[hsl(var(--filter-active-foreground))]">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 rounded-xl p-4" align="end">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-popover-foreground">
                        {t("curator")}
                      </div>
                      <Select
                        value={initialCurator || "__all__"}
                        onValueChange={(value) =>
                          updateParams({
                            curator: value === "__all__" ? null : value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("allCurators")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">
                            {t("allCurators")}
                          </SelectItem>
                          {curators.map((curator) => (
                            <SelectItem key={curator.id} value={curator.id}>
                              {curator.name || tProfile("anonymous")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-popover-foreground">
                        {t("status")}
                      </div>
                      <Select
                        value={initialStatus || "__all__"}
                        onValueChange={(value) =>
                          updateParams({
                            status: value === "__all__" ? null : value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("allStatuses")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">
                            {t("allStatuses")}
                          </SelectItem>
                          <SelectItem value="active">{t("active")}</SelectItem>
                          <SelectItem value="inactive">
                            {t("inactive")}
                          </SelectItem>
                          <SelectItem value="upcoming">
                            {t("upcoming")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {hasFilters && (
                      <div className="border-t border-border pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            handleClear();
                            setIsFiltersOpen(false);
                          }}
                          className="w-full rounded-lg"
                        >
                          {t("clearAll")}
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {hasFilters && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="rounded-xl"
                >
                  {t("clear")}
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
