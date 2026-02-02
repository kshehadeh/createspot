import { prisma } from "@/lib/prisma";

export type HomepageCarouselFallback = "latest" | "hero";

export interface SiteSettings {
  homepageCarouselExhibitId: string | null;
  homepageCarouselFallback: HomepageCarouselFallback;
  homepageHeroSubmissionId: string | null;
}

const DEFAULT_SETTINGS: SiteSettings = {
  homepageCarouselExhibitId: null,
  homepageCarouselFallback: "latest",
  homepageHeroSubmissionId: null,
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await prisma.siteSetting.findMany({
    where: {
      key: {
        in: [
          "homepageCarouselExhibitId",
          "homepageCarouselFallback",
          "homepageHeroSubmissionId",
        ],
      },
    },
  });

  const map = new Map(rows.map((r) => [r.key, r.value] as const));
  const rawFallback = map.get("homepageCarouselFallback");
  const fallback =
    typeof rawFallback === "string" &&
    (rawFallback === "latest" || rawFallback === "hero")
      ? rawFallback
      : DEFAULT_SETTINGS.homepageCarouselFallback;

  const asNullableString = (value: unknown): string | null =>
    typeof value === "string" ? value : null;

  return {
    homepageCarouselExhibitId: asNullableString(
      map.get("homepageCarouselExhibitId"),
    ),
    homepageCarouselFallback: fallback,
    homepageHeroSubmissionId: asNullableString(
      map.get("homepageHeroSubmissionId"),
    ),
  };
}

export async function updateSiteSettings(
  next: Partial<SiteSettings>,
): Promise<SiteSettings> {
  const current = await getSiteSettings();
  const merged: SiteSettings = { ...current, ...next };

  const ops = [];

  // Always persist fallback (has a default)
  ops.push(
    prisma.siteSetting.upsert({
      where: { key: "homepageCarouselFallback" },
      create: {
        key: "homepageCarouselFallback",
        value: merged.homepageCarouselFallback,
      },
      update: { value: merged.homepageCarouselFallback },
    }),
  );

  if (merged.homepageCarouselExhibitId) {
    ops.push(
      prisma.siteSetting.upsert({
        where: { key: "homepageCarouselExhibitId" },
        create: {
          key: "homepageCarouselExhibitId",
          value: merged.homepageCarouselExhibitId,
        },
        update: { value: merged.homepageCarouselExhibitId },
      }),
    );
  } else {
    ops.push(
      prisma.siteSetting.deleteMany({
        where: { key: "homepageCarouselExhibitId" },
      }),
    );
  }

  if (merged.homepageHeroSubmissionId) {
    ops.push(
      prisma.siteSetting.upsert({
        where: { key: "homepageHeroSubmissionId" },
        create: {
          key: "homepageHeroSubmissionId",
          value: merged.homepageHeroSubmissionId,
        },
        update: { value: merged.homepageHeroSubmissionId },
      }),
    );
  } else {
    ops.push(
      prisma.siteSetting.deleteMany({
        where: { key: "homepageHeroSubmissionId" },
      }),
    );
  }

  await prisma.$transaction(ops);

  return merged;
}
