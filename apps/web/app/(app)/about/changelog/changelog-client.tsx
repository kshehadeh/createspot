"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@createspot/ui-primitives/button";
import { Card, CardContent } from "@/components/ui/card";

interface ChangelogRelease {
  tagName: string;
  publishedAt: string;
  body: string;
  htmlUrl: string;
}

interface ChangelogResponse {
  releases: ChangelogRelease[];
  hasMore: boolean;
  error?: string;
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

        const res = await fetch(`/api/changelog?limit=${limit}`, {
          cache: "no-store",
        });
        const json = (await res.json()) as ChangelogResponse;
        if (!res.ok) {
          throw new Error(json.error ?? `Request failed (${res.status})`);
        }
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

  const releases = useMemo(() => data?.releases ?? [], [data]);
  const canLoadMore = data?.hasMore ?? false;

  return (
    <div className="space-y-6">
      {error ? (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            {t("loadError", { error })}
          </CardContent>
        </Card>
      ) : null}

      {isLoading && releases.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            {t("loading")}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {releases.map((release) => (
          <Card key={release.tagName}>
            <CardContent className="p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  {release.tagName}
                </h2>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <div className="text-xs text-muted-foreground">
                    {formatDate(release.publishedAt)}
                  </div>
                  <a
                    href={release.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {t("viewOnGitHub")}
                  </a>
                </div>
              </div>
              <div className="mt-4 text-sm leading-relaxed text-foreground/90">
                {release.body ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-a:text-primary">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline underline-offset-2"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {release.body}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t("emptyBody")}</p>
                )}
              </div>
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
        ) : releases.length > 0 ? (
          <p className="text-sm text-muted-foreground">{t("end")}</p>
        ) : !isLoading && !error ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : null}
      </div>
    </div>
  );
}
