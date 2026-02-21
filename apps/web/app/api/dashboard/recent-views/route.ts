import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const views = await prisma.submissionView.findMany({
    where: {
      viewerUserId: session.user.id,
    },
    orderBy: { viewedAt: "desc" },
    take: 5,
    select: {
      viewedAt: true,
      submission: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          imageFocalPoint: true,
          user: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ views });
}
