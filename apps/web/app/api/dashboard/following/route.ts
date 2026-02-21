import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const follows = await prisma.follow.findMany({
    where: {
      followerId: session.user.id,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      createdAt: true,
      following: {
        select: {
          id: true,
          name: true,
          image: true,
          profileImageUrl: true,
          slug: true,
          submissions: {
            where: {
              shareStatus: "PUBLIC",
              OR: [{ imageUrl: { not: null } }, { text: { not: null } }],
            },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              title: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ follows });
}
