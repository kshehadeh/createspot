"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
  count: number;
}

interface CategoryRow {
  name: string;
  count: number;
}

interface AnalyticsResponse {
  submissionsByDay: DayRow[];
  categoryDistribution: CategoryRow[];
  tagDistribution: CategoryRow[];
  tagDistributionTruncated: boolean;
  tagDistributionLimit: number;
  portfolioItemCount: number;
}

function truncateTagAxisLabel(value: string): string {
  const max = 28;
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1)}…`;
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
  primary: string;
  muted: string;
  foreground: string;
  border: string;
  grid: string;
  pieFills: string[];
} {
  const { resolvedTheme } = useTheme();
  const [palette, setPalette] = useState({
    primary: "hsl(240 5.9% 10%)",
    muted: "hsl(240 3.8% 46.1%)",
    foreground: "hsl(240 10% 3.9%)",
    border: "hsl(240 5.9% 80%)",
    grid: "hsl(240 5.9% 90%)",
    pieFills: [
      "hsl(240 5.9% 10%)",
      "hsl(142 71% 45%)",
      "hsl(25 85% 35%)",
      "hsl(262 83% 58%)",
      "hsl(199 89% 48%)",
      "hsl(330 81% 60%)",
    ],
  });

  useEffect(() => {
    setPalette({
      primary: hslVar("--primary"),
      muted: hslVar("--muted-foreground"),
      foreground: hslVar("--foreground"),
      border: hslVar("--border"),
      grid: hslVar("--border"),
      pieFills: [
        hslVar("--primary"),
        hslVar("--prompt"),
        hslVar("--accent-foreground"),
        "hsl(262 83% 58%)",
        "hsl(199 89% 48%)",
        "hsl(330 81% 60%)",
      ],
    });
  }, [resolvedTheme]);

  return palette;
}

function formatUtcDayLabel(dateKey: string, locale: string): string {
  return new Date(`${dateKey}T12:00:00.000Z`).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function DashboardAnalyticsSection() {
  const t = useTranslations("dashboard.analytics");
  const locale = useLocale();
  const palette = useChartPalette();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/analytics")
      .then((r) => r.json())
      .then((json: AnalyticsResponse) => {
        if (
          json.submissionsByDay &&
          json.categoryDistribution &&
          Array.isArray(json.tagDistribution) &&
          typeof json.portfolioItemCount === "number"
        ) {
          setData(json);
        } else {
          setData(null);
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const pieData = useMemo(() => {
    if (!data?.categoryDistribution.length) {
      return [];
    }
    return data.categoryDistribution.map((row) => ({
      name: row.name === "__uncategorized__" ? t("uncategorized") : row.name,
      value: row.count,
    }));
  }, [data?.categoryDistribution, t]);

  const tagBarRows = useMemo(() => {
    if (!data?.tagDistribution.length) {
      return [];
    }
    return [...data.tagDistribution].reverse();
  }, [data?.tagDistribution]);

  const chartHeight = 280;
  const tagBarHeight = useMemo(() => {
    const n = Math.max(1, tagBarRows.length);
    return Math.min(520, Math.max(200, n * 32 + 56));
  }, [tagBarRows.length]);

  const chartsRowClass =
    "flex flex-col gap-4 lg:flex-row lg:gap-4 [&>*]:min-w-0 lg:[&>*]:flex-1 lg:[&>*]:basis-0";

  if (loading) {
    return (
      <div className="space-y-4">
        <div className={chartsRowClass}>
          <DashboardSection title={t("submissionsOverTime")}>
            <Skeleton
              className="w-full rounded-md"
              style={{ height: chartHeight }}
            />
          </DashboardSection>
          <DashboardSection title={t("categoryDistribution")}>
            <Skeleton
              className="w-full rounded-md"
              style={{ height: chartHeight }}
            />
          </DashboardSection>
        </div>
        <DashboardSection title={t("tagDistribution")}>
          <Skeleton className="w-full rounded-md" style={{ height: 320 }} />
        </DashboardSection>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className={chartsRowClass}>
          <DashboardSection title={t("submissionsOverTime")}>
            <p className="text-sm text-muted-foreground">{t("loadError")}</p>
          </DashboardSection>
          <DashboardSection title={t("categoryDistribution")}>
            <p className="text-sm text-muted-foreground">{t("loadError")}</p>
          </DashboardSection>
        </div>
        <DashboardSection title={t("tagDistribution")}>
          <p className="text-sm text-muted-foreground">{t("loadError")}</p>
        </DashboardSection>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={chartsRowClass}>
        <DashboardSection title={t("submissionsOverTime")}>
          <div
            className="w-full min-w-0"
            style={{ height: chartHeight }}
            role="img"
            aria-label={t("submissionsAria")}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.submissionsByDay}
                margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
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
                  width={36}
                  tick={{ fill: palette.muted, fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: palette.border }}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length || label == null) {
                      return null;
                    }
                    const count = Number(payload[0]?.value ?? 0);
                    return (
                      <div className="rounded-md border border-border bg-popover px-2 py-1.5 text-xs text-popover-foreground shadow-md">
                        <p className="font-medium">
                          {formatUtcDayLabel(String(label), locale)}
                        </p>
                        <p className="text-muted-foreground">
                          {t("submissionsTooltip", { count })}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="count"
                  fill={palette.primary}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardSection>

        <DashboardSection title={t("categoryDistribution")}>
          {pieData.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("emptyCategories")}
            </p>
          ) : (
            <div
              className="w-full min-w-0"
              style={{ height: chartHeight }}
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
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={pieData[index]?.name}
                        fill={
                          palette.pieFills[index % palette.pieFills.length] ??
                          palette.primary
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
                      const total = pieData.reduce((s, p) => s + p.value, 0);
                      const pct =
                        total > 0 ? Math.round((value / total) * 100) : 0;
                      return (
                        <div className="rounded-md border border-border bg-popover px-2 py-1.5 text-xs text-popover-foreground shadow-md">
                          <p className="font-medium">{name}</p>
                          <p className="text-muted-foreground">
                            {t("categoryTooltip", {
                              count: value,
                              percent: pct,
                            })}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, color: palette.muted }}
                    formatter={(value) => (
                      <span className="text-muted-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </DashboardSection>
      </div>

      <DashboardSection title={t("tagDistribution")}>
        {data.portfolioItemCount === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("emptyTagsNoPortfolio")}
          </p>
        ) : data.tagDistribution.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("emptyTagsNoneYet")}
          </p>
        ) : (
          <>
            <div
              className="w-full min-w-0"
              style={{ height: tagBarHeight }}
              role="img"
              aria-label={t("tagsAria")}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={tagBarRows}
                  margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
                >
                  <CartesianGrid
                    stroke={palette.grid}
                    strokeDasharray="3 3"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: palette.muted, fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: palette.border }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={152}
                    tick={{ fill: palette.muted, fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: palette.border }}
                    tickFormatter={truncateTagAxisLabel}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) {
                        return null;
                      }
                      const row = payload[0]?.payload as CategoryRow;
                      const count = Number(row?.count ?? 0);
                      const pct =
                        data.portfolioItemCount > 0
                          ? Math.round((count / data.portfolioItemCount) * 100)
                          : 0;
                      const name = String(row?.name ?? "");
                      return (
                        <div className="rounded-md border border-border bg-popover px-2 py-1.5 text-xs text-popover-foreground shadow-md">
                          <p className="font-medium">{name}</p>
                          <p className="text-muted-foreground">
                            {t("tagTooltip", { count, percent: pct })}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill={palette.primary}
                    radius={[0, 4, 4, 0]}
                    barSize={22}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {data.tagDistributionTruncated ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("tagDistributionTruncatedNote", {
                  limit: data.tagDistributionLimit,
                })}
              </p>
            ) : null}
          </>
        )}
      </DashboardSection>
    </div>
  );
}
