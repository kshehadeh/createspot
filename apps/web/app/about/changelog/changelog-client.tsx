"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ChangelogEntry {
  time: string;
  commit: string;
  type: string;
  audience?: "public" | "development";
  area: string;
  description: string;
  impact?: "patch" | "minor" | "major";
  version?: string;
}

interface ChangelogResponse {
  entries: ChangelogEntry[];
  total: number;
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ChangelogClient({ initialLimit }: { initialLimit: number }) {
  const t = useTranslations("aboutChangelog");
  const [limit, setLimit] = useState(initialLimit);
  const [data, setData] = useState<ChangelogResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(
          `/api/changelog?limit=${limit}&audience=public`,
          {
            cache: "no-store",
          },
        );
        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }

        const json = (await res.json()) as ChangelogResponse;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Unknown error");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  const entries = useMemo(() => data?.entries ?? [], [data]);
  const canLoadMore = data ? entries.length < data.total : false;

  return (
    <div className="space-y-6">
      {error ? (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            {t("loadError", { error })}
          </CardContent>
        </Card>
      ) : null}

      {isLoading && entries.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            {t("loading")}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {entries.map((entry) => (
          <Card key={`${entry.commit}-${entry.time}-${entry.description}`}>
            <CardContent className="p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {entry.type}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {entry.area}
                  </Badge>
                  <Badge variant="outline">
                    {entry.version ? `v${entry.version}` : t("unreleased")}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(entry.time)}
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                {entry.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        {canLoadMore ? (
          <Button
            variant="secondary"
            onClick={() => setLimit((v) => v + initialLimit)}
            disabled={isLoading}
          >
            {isLoading ? t("loadingMore") : t("loadMore")}
          </Button>
        ) : data && entries.length > 0 ? (
          <p className="text-sm text-muted-foreground">{t("end")}</p>
        ) : null}
      </div>
    </div>
  );
}
