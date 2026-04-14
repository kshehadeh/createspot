import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_TAKE = 10;
const MAX_TAKE = 20;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawQ = searchParams.get("q") ?? "";
  const q = rawQ.trim();

  const takeParam = Number.parseInt(searchParams.get("take") ?? "", 10);
  const take = Number.isFinite(takeParam)
    ? Math.min(Math.max(takeParam, 1), MAX_TAKE)
    : DEFAULT_TAKE;

  if (!q) {
    return NextResponse.json({ creators: [] });
  }

  const creators = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { bio: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { stateProvince: { contains: q, mode: "insensitive" } },
        { country: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      profileImageUrl: true,
      image: true,
      _count: {
        select: {
          submissions: true,
        },
      },
    },
    orderBy: { name: "asc" },
    take,
  });

  return NextResponse.json({ creators });
}
