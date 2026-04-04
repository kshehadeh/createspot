import type { Prisma } from "@/app/generated/prisma/client";

export const PORTFOLIO_SORT_VALUES = [
  "order",
  "newest",
  "oldest",
  "title",
  "favorites",
] as const;

export type PortfolioSortValue = (typeof PORTFOLIO_SORT_VALUES)[number];

export function parsePortfolioSortParam(
  raw: string | string[] | undefined,
): PortfolioSortValue {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v && (PORTFOLIO_SORT_VALUES as readonly string[]).includes(v)) {
    return v as PortfolioSortValue;
  }
  return "order";
}

export function portfolioSortAllowsReorder(sort: PortfolioSortValue): boolean {
  return sort === "order";
}

export function buildPortfolioSearchWhere(
  q: string | undefined,
): Pick<Prisma.SubmissionWhereInput, "OR"> | Record<string, never> {
  const trimmed = q?.trim();
  if (!trimmed) {
    return {};
  }
  return {
    OR: [
      { title: { contains: trimmed, mode: "insensitive" } },
      { text: { contains: trimmed, mode: "insensitive" } },
      { category: { contains: trimmed, mode: "insensitive" } },
    ],
  };
}

export function buildPortfolioOrderBy(
  sort: PortfolioSortValue,
): Prisma.SubmissionOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "oldest":
      return [{ createdAt: "asc" }];
    case "title":
      return [{ title: "asc" }, { createdAt: "desc" }];
    case "favorites":
      return [{ favorites: { _count: "desc" } }, { portfolioOrder: "asc" }];
    case "order":
    default:
      return [{ portfolioOrder: "asc" }, { createdAt: "desc" }];
  }
}
