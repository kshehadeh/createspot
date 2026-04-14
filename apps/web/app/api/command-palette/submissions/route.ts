import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/app/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_TAKE = 10;
const MAX_TAKE = 20;

export async function GET(request: NextRequest) {
  const session = await auth();
  const viewerUserId = session?.user?.id ?? null;

  const searchParams = request.nextUrl.searchParams;
  const rawQ = searchParams.get("q") ?? "";
  const q = rawQ.trim();

  const takeParam = Number.parseInt(searchParams.get("take") ?? "", 10);
  const take = Number.isFinite(takeParam)
    ? Math.min(Math.max(takeParam, 1), MAX_TAKE)
    : DEFAULT_TAKE;

  if (!q) {
    return NextResponse.json({ submissions: [] });
  }

  const visibilityFilter: Prisma.SubmissionWhereInput =
    viewerUserId != null
      ? {
          OR: [
            { shareStatus: { in: ["PUBLIC", "PROFILE"] } },
            { userId: viewerUserId },
          ],
        }
      : { shareStatus: { in: ["PUBLIC", "PROFILE"] } };

  const submissions = await prisma.submission.findMany({
    where: {
      isPortfolio: true,
      AND: [
        {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { text: { contains: q, mode: "insensitive" } },
          ],
        },
        visibilityFilter,
      ],
    },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      shareStatus: true,
      user: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
    take,
  });

  return NextResponse.json({ submissions });
}
