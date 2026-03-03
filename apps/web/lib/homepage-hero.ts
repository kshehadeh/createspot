import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";

async function getRecentWork() {
  return prisma.submission.findMany({
    where: {
      shareStatus: "PUBLIC",
      OR: [{ imageUrl: { not: null } }, { text: { not: null } }],
    },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
}

export type HomepageHeroData =
  | {
      type: "carousel";
      submissions: Awaited<ReturnType<typeof getRecentWork>>;
    }
  | {
      type: "hero";
      submission: Awaited<ReturnType<typeof getRecentWork>>[number];
    }
  | {
      type: "none";
    };

export async function getHomepageHeroData(): Promise<HomepageHeroData> {
  const settings = await getSiteSettings();

  if (settings.homepageCarouselExhibitId) {
    const rows = await prisma.exhibitSubmission.findMany({
      where: {
        exhibitId: settings.homepageCarouselExhibitId,
        submission: {
          shareStatus: "PUBLIC",
          OR: [{ imageUrl: { not: null } }, { text: { not: null } }],
        },
      },
      orderBy: { order: "asc" },
      take: 8,
      include: {
        submission: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    const submissions = rows.map((r) => r.submission);
    if (submissions.length > 0) {
      return { type: "carousel", submissions };
    }
  }

  if (settings.homepageCarouselFallback === "hero") {
    if (!settings.homepageHeroSubmissionId) {
      return { type: "none" };
    }

    const submission = await prisma.submission.findFirst({
      where: {
        id: settings.homepageHeroSubmissionId,
        shareStatus: "PUBLIC",
        imageUrl: { not: null },
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    if (!submission) {
      return { type: "none" };
    }

    return { type: "hero", submission };
  }

  const submissions = await getRecentWork();
  return { type: "carousel", submissions };
}
