import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await prisma.submission.findMany({
    where: {
      userId: session.user.id,
      isPortfolio: true,
    },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      title: true,
      imageUrl: true,
      imageFocalPoint: true,
      text: true,
      shareStatus: true,
      isWorkInProgress: true,
      createdAt: true,
      progressions: {
        orderBy: { order: "desc" },
        take: 1,
        select: {
          imageUrl: true,
          text: true,
        },
      },
    },
  });

  const submissions = raw.map((s) => {
    const latest = s.progressions?.[0];
    return {
      ...s,
      latestProgressionImageUrl: latest?.imageUrl ?? null,
      latestProgressionText: latest?.text ?? null,
      progressions: undefined,
    };
  });

  return NextResponse.json({ submissions });
}
