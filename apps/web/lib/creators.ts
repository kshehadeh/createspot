import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Fetches creator by slug or ID. Cached for public profile views.
 */
export async function getCreator(creatorid: string) {
  "use cache";
  cacheLife("days");
  cacheTag("creator", `creator-${creatorid}`);

  return prisma.user.findFirst({
    where: {
      OR: [{ slug: creatorid }, { id: creatorid }],
    },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });
}
