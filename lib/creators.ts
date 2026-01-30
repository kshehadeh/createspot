import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Fetches creator by slug or ID. Cached per request for deduplication.
 */
export const getCreator = cache(async function getCreator(creatorid: string) {
  return prisma.user.findFirst({
    where: {
      OR: [{ slug: creatorid }, { id: creatorid }],
    },
    select: {
      id: true,
      slug: true,
    },
  });
});
