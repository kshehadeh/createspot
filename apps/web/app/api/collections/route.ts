import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");

  // If userId is provided, show public collections for that user
  // Otherwise, show all collections for the current user
  if (userId && userId !== session.user.id) {
    const collections = await prisma.collection.findMany({
      where: {
        userId,
        isPublic: true,
      },
      include: {
        submissions: {
          orderBy: { order: "asc" },
          take: 1,
          include: {
            submission: {
              select: {
                id: true,
                imageUrl: true,
                imageFocalPoint: true,
                text: true,
                title: true,
              },
            },
          },
        },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ collections });
  }

  // Current user's collections (all of them)
  const collections = await prisma.collection.findMany({
    where: { userId: session.user.id },
    include: {
      submissions: {
        orderBy: { order: "asc" },
        take: 1,
        include: {
          submission: {
            select: {
              id: true,
              imageUrl: true,
              imageFocalPoint: true,
              text: true,
              title: true,
            },
          },
        },
      },
      _count: {
        select: { submissions: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ collections });
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, isPublic } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Collection name is required" },
      { status: 400 },
    );
  }

  const collection = await prisma.collection.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      description: description?.trim() || null,
      isPublic: isPublic ?? false,
    },
    include: {
      _count: {
        select: { submissions: true },
      },
    },
  });

  return NextResponse.json({ collection });
}
