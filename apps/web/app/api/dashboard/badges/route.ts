import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { badgeDefinitionsByKey, type BadgeKey } from "@/lib/badges";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const awards = await prisma.badgeAward.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: { awardedAt: "asc" },
    select: {
      badgeKey: true,
      awardedAt: true,
    },
  });

  const badges = awards
    .map((award) => {
      const def = badgeDefinitionsByKey[award.badgeKey as BadgeKey];
      if (!def) return null;
      return {
        key: award.badgeKey,
        name: def.name,
        description: def.description,
        image: def.image,
        awardedAt: award.awardedAt,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ badges });
}
