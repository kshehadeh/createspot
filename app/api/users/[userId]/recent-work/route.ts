import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  try {
    // Fetch user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        slug: true,
        name: true,
        image: true,
        city: true,
        stateProvince: true,
        country: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch user's recent public submissions (3-6 most recent)
    const submissions = await prisma.submission.findMany({
      where: {
        userId: user.id,
        shareStatus: "PUBLIC",
        OR: [{ imageUrl: { not: null } }, { text: { not: null } }],
      },
      orderBy: { createdAt: "desc" },
      take: 6,
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
          },
        },
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        slug: user.slug,
        name: user.name,
        image: user.image,
        city: user.city,
        stateProvince: user.stateProvince,
        country: user.country,
      },
      submissions: submissions.map((submission) => ({
        id: submission.id,
        title: submission.title,
        imageUrl: submission.imageUrl,
        text: submission.text,
        createdAt: submission.createdAt.toISOString(),
        prompt: submission.prompt,
        _count: submission._count,
      })),
    });
  } catch (error) {
    console.error("Error fetching user recent work:", error);
    return NextResponse.json(
      { error: "Failed to fetch user work" },
      { status: 500 },
    );
  }
}
