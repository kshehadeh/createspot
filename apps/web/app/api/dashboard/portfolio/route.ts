import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const submissions = await prisma.submission.findMany({
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
      createdAt: true,
    },
  });

  return NextResponse.json({ submissions });
}
