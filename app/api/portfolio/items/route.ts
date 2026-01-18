import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const skip = parseInt(searchParams.get("skip") || "0", 10);
  const take = parseInt(
    searchParams.get("take") || String(DEFAULT_PAGE_SIZE),
    10,
  );

  const [items, totalCount] = await Promise.all([
    prisma.submission.findMany({
      where: {
        userId: session.user.id,
        isPortfolio: true,
      },
      orderBy: [{ portfolioOrder: "asc" }, { createdAt: "desc" }],
      skip,
      take,
      include: {
        prompt: {
          select: {
            word1: true,
            word2: true,
            word3: true,
          },
        },
        _count: {
          select: {
            favorites: true,
            views: true,
          },
        },
      },
    }),
    prisma.submission.count({
      where: {
        userId: session.user.id,
        isPortfolio: true,
      },
    }),
  ]);

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      imageUrl: item.imageUrl,
      imageFocalPoint: item.imageFocalPoint,
      text: item.text,
      isPortfolio: item.isPortfolio,
      portfolioOrder: item.portfolioOrder,
      tags: item.tags,
      category: item.category,
      promptId: item.promptId,
      wordIndex: item.wordIndex,
      prompt: item.prompt,
      shareStatus: item.shareStatus,
      _count: item._count,
    })),
    totalCount,
    hasMore: skip + take < totalCount,
  });
}
