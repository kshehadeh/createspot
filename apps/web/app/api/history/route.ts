import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const skip = parseInt(searchParams.get("skip") || "0", 10);
  const take = parseInt(searchParams.get("take") || "10", 10);
  const userId = searchParams.get("userId") || session.user.id;

  const prompts = await prisma.prompt.findMany({
    where: {
      submissions: {
        some: {
          userId,
        },
      },
    },
    orderBy: { weekStart: "desc" },
    skip,
    take: take + 1,
    include: {
      submissions: {
        where: {
          userId,
        },
        orderBy: { wordIndex: "asc" },
      },
    },
  });

  const hasMore = prompts.length > take;
  const items = hasMore ? prompts.slice(0, take) : prompts;

  return NextResponse.json({
    items,
    hasMore,
  });
}
