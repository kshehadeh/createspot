"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardSection } from "@/components/dashboard-section";
import { Skeleton } from "@/components/ui/skeleton";

interface DayRow {
  dateKey: string;
  portfolioCount: number;
  otherCount: number;
}

interface CategoryRow {
  name: string;
  count: number;
}

export interface DashboardAnalyticsPayload {
  submissionsByDay: DayRow[];
  categoryDistribution: CategoryRow[];
  tagDistribution: CategoryRow[];
  tagDistributionTruncated: boolean;
  tagDistributionLimit: number;
  portfolioItemCount: number;
  momentumPercent?: number | null;
  previousWindowSubmissionCount?: number;
  currentWindowSubmissionCount?: number;
}

function hslVar(name: string): string {
  if (typeof document === "undefined") {
    return "hsl(0 0% 45%)";
  }
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return raw ? `hsl(${raw})` : "hsl(0 0% 45%)";
}

function useChartPalette(): {
  foreground: string;
  muted: string;
  border: string;
  grid: string;
  pieFills: string[];
  portfolioBar: string;
  otherBar: string;
} {
  const [palette, setPalette] = useState({
    foreground: "hsl(0 8% 98%)",
    muted: "hsl(60 1% 55%)",
    border: "hsl(0 0% 28%)",
    grid: "hsl(0 0% 22%)",
    pieFills: ["hsl(0 0% 98%)", "hsl(38 42% 58%)", "hsl(0 0% 45%)"] as string[],
    portfolioBar: "hsl(0 0% 98%)",
    otherBar: "hsl(0 0% 100% / 0.22)",
  });

  useEffect(() => {
    setPalette({
      foreground: hslVar("--foreground"),
      muted: hslVar("--muted-foreground"),
      border: hslVar("--border"),
      grid: "hsl(0 0% 18%)",
      pieFills: [
        hslVar("--foreground"),
        "hsl(38 42% 58%)",
        hslVar("--muted-foreground"),
      ],
      portfolioBar: "hsl(0 0% 98%)",
      otherBar: "hsl(0 0% 100% / 0.22)",
    });
  }, []);

  return palette;
}

function formatUtcDayLabel(dateKey: string, locale: string): string {
  return new Date(`${dateKey}T12:00:00.000Z`).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

const chartHeight = 260;
const donutHeight = 220;

export function parseDashboardAnalyticsResponse(
  json: unknown,
): DashboardAnalyticsPayload | null {
  if (!json || typeof json !== "object") {
    return null;
  }
  const o = json as Record<string, unknown>;
  if (
    !Array.isArray(o.submissionsByDay) ||
    !Array.isArray(o.categoryDistribution) ||
    !Array.isArray(o.tagDistribution) ||
    typeof o.tagDistributionTruncated !== "boolean" ||
    typeof o.tagDistributionLimit !== "number" ||
    typeof o.portfolioItemCount !== "number"
  ) {
    return null;
  }
  return o as unknown as DashboardAnalyticsPayload;
}

export function DashboardSubmissionsActivity({
  data,
  loading,
}: {
  data: DashboardAnalyticsPayload | null;
  loading: boolean;
}) {
  const t = useTranslations("dashboard.analytics");
  const locale = useLocale();
  const palette = useChartPalette();

  if (loading) {
    return (
      <DashboardSection title={t("submissionsActivityTitle")} editorial>
        <p className="dashboard-editorial-muted mb-4 text-[11px] font-medium tracking-[0.14em] uppercase">
          {t("submissionsActivitySubtitle")}
        </p>
        <Skeleton
          className="w-full rounded-xl"
          style={{ height: chartHeight }}
        />
      </DashboardSection>
    );
  }

  if (!data) {
    return (
      <DashboardSection title={t("submissionsActivityTitle")} editorial>
        <p className="text-sm text-on-surface-variant">{t("loadError")}</p>
      </DashboardSection>
    );
  }

  const legend = (
    <div className="flex flex-wrap items-center justify-end gap-4 text-[10px] font-medium tracking-[0.12em] uppercase">
      <span className="text-on-surface-variant flex items-center gap-1.5">
        <span
          className="inline-block size-2 rounded-full"
          style={{ background: palette.portfolioBar }}
        />
        {t("stackedLegendPortfolio")}
      </span>
      <span className="text-on-surface-variant flex items-center gap-1.5">
        <span
          className="inline-block size-2 rounded-full bg-white/25"
          aria-hidden
        />
        {t("stackedLegendOther")}
      </span>
    </div>
  );

  return (
    <DashboardSection
      title={t("submissionsActivityTitle")}
      editorial
      action={legend}
    >
      <p className="dashboard-editorial-muted -mt-1 mb-4 text-[11px] font-medium tracking-[0.14em] uppercase">
        {t("submissionsActivitySubtitle")}
      </p>
      <div
        className="w-full min-w-0"
        style={{ height: chartHeight }}
        role="img"
        aria-label={t("submissionsAria")}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.submissionsByDay}
            margin={{ top: 8, right: 4, left: 0, bottom: 4 }}
          >
            <CartesianGrid
              stroke={palette.grid}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="dateKey"
              tick={{ fill: palette.muted, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: palette.border }}
              interval={4}
              tickFormatter={(value: string) =>
                formatUtcDayLabel(value, locale)
              }
            />
            <YAxis
              allowDecimals={false}
              width={32}
              tick={{ fill: palette.muted, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: palette.border }}
            />
            <Tooltip
              cursor={{ fill: "hsl(0 0% 100% / 0.04)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length || label == null) {
                  return null;
                }
                const port = Number(
                  payload.find((p) => p.dataKey === "portfolioCount")?.value ??
                    0,
                );
                const other = Number(
                  payload.find((p) => p.dataKey === "otherCount")?.value ?? 0,
                );
                return (
                  <div className="rounded-lg border border-white/10 bg-[#1a1a1a] px-2.5 py-2 text-xs text-foreground shadow-xl">
                    <p className="font-medium">
                      {formatUtcDayLabel(String(label), locale)}
                    </p>
                    <p className="mt-1 text-on-surface-variant">
                      {t("stackedTooltipPortfolio", { count: port })}
                    </p>
                    <p className="text-on-surface-variant">
                      {t("stackedTooltipOther", { count: other })}
                    </p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="portfolioCount"
              stackId="sub"
              fill={palette.portfolioBar}
              maxBarSize={32}
            />
            <Bar
              dataKey="otherCount"
              stackId="sub"
              fill="rgba(255,255,255,0.22)"
              maxBarSize={32}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardSection>
  );
}

export function DashboardCategoryPortfolio({
  data,
  loading,
}: {
  data: DashboardAnalyticsPayload | null;
  loading: boolean;
}) {
  const t = useTranslations("dashboard.analytics");
  const palette = useChartPalette();

  const pieData = useMemo(() => {
    if (!data?.categoryDistribution.length) {
      return [];
    }
    return data.categoryDistribution.map((row) => ({
      name: row.name === "__uncategorized__" ? t("uncategorized") : row.name,
      value: row.count,
    }));
  }, [data?.categoryDistribution, t]);

  const total = data?.portfolioItemCount ?? 0;

  if (loading) {
    return (
      <DashboardSection title={t("categoryDistribution")} editorial>
        <Skeleton
          className="mx-auto rounded-full"
          style={{ width: 200, height: 200 }}
        />
      </DashboardSection>
    );
  }

  if (!data) {
    return (
      <DashboardSection title={t("categoryDistribution")} editorial>
        <p className="text-sm text-on-surface-variant">{t("loadError")}</p>
      </DashboardSection>
    );
  }

  if (pieData.length === 0) {
    return (
      <DashboardSection title={t("categoryDistribution")} editorial>
        <p className="text-sm text-on-surface-variant">
          {t("emptyCategories")}
        </p>
      </DashboardSection>
    );
  }

  return (
    <DashboardSection title={t("categoryDistribution")} editorial>
      <div className="relative mx-auto w-full max-w-[240px]">
        <div
          style={{ height: donutHeight }}
          role="img"
          aria-label={t("categoriesAria")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={2}
                stroke="none"
              >
                {pieData.map((_, index) => (
                  <Cell
                    key={pieData[index]?.name}
                    fill={
                      palette.pieFills[index % palette.pieFills.length] ??
                      palette.foreground
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) {
                    return null;
                  }
                  const item = payload[0];
                  const name = String(item?.name ?? "");
                  const value = Number(item?.value ?? 0);
                  const sum = pieData.reduce((s, p) => s + p.value, 0);
                  const pct = sum > 0 ? Math.round((value / sum) * 100) : 0;
                  return (
                    <div className="rounded-lg border border-white/10 bg-[#1a1a1a] px-2.5 py-2 text-xs text-foreground shadow-xl">
                      <p className="font-medium">{name}</p>
                      <p className="text-on-surface-variant">
                        {t("categoryTooltip", {
                          count: value,
                          percent: pct,
                        })}
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-1">
          <span className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
            {total}
          </span>
          <span className="dashboard-editorial-muted mt-1 text-[10px] font-medium tracking-[0.16em] uppercase">
            {t("totalPortfolioItems")}
          </span>
        </div>
      </div>
      <ul className="mt-5 space-y-2.5">
        {pieData.map((row, index) => {
          const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
          const fill =
            palette.pieFills[index % palette.pieFills.length] ??
            palette.foreground;
          return (
            <li
              key={row.name}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: fill }}
                />
                <span className="truncate text-foreground">{row.name}</span>
              </span>
              <span className="shrink-0 tabular-nums text-on-surface-variant">
                {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </DashboardSection>
  );
}

export function DashboardTagArchive({
  data,
  loading,
}: {
  data: DashboardAnalyticsPayload | null;
  loading: boolean;
}) {
  const t = useTranslations("dashboard.analytics");

  if (loading) {
    return (
      <DashboardSection title={t("tagArchiveTitle")} editorial>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </DashboardSection>
    );
  }

  if (!data) {
    return (
      <DashboardSection title={t("tagArchiveTitle")} editorial>
        <p className="text-sm text-on-surface-variant">{t("loadError")}</p>
      </DashboardSection>
    );
  }

  if (data.portfolioItemCount === 0) {
    return (
      <DashboardSection title={t("tagArchiveTitle")} editorial>
        <p className="text-sm text-on-surface-variant">
          {t("emptyTagsNoPortfolio")}
        </p>
      </DashboardSection>
    );
  }

  if (data.tagDistribution.length === 0) {
    return (
      <DashboardSection title={t("tagArchiveTitle")} editorial>
        <p className="text-sm text-on-surface-variant">
          {t("emptyTagsNoneYet")}
        </p>
      </DashboardSection>
    );
  }

  return (
    <DashboardSection title={t("tagArchiveTitle")} editorial>
      <div
        className="flex flex-wrap gap-2"
        role="list"
        aria-label={t("tagsAria")}
      >
        {data.tagDistribution.map((row) => (
          <span
            key={row.name}
            role="listitem"
            className="rounded-md border border-white/[0.06] bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.08em] text-foreground uppercase"
          >
            {row.name}
          </span>
        ))}
      </div>
      {data.tagDistributionTruncated ? (
        <p className="mt-3 text-[11px] text-on-surface-variant">
          {t("tagDistributionTruncatedNote", {
            limit: data.tagDistributionLimit,
          })}
        </p>
      ) : null}
    </DashboardSection>
  );
}
