import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentExhibits } from "@/lib/exhibits";

export async function GET(request: NextRequest) {
  const session = await auth();
  const searchParams = request.nextUrl.searchParams;
  const admin = searchParams.get("admin") === "true";

  // Admin can see all exhibits
  if (admin && session?.user?.isAdmin) {
    const exhibits = await prisma.exhibit.findMany({
      include: {
        curator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        featuredArtist: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        featuredSubmission: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            text: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return NextResponse.json({ exhibits });
  }

  // Public users see only current active exhibits
  const exhibits = await getCurrentExhibits();
  return NextResponse.json({ exhibits });
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    description,
    startTime,
    endTime,
    isActive,
    curatorId,
    allowedViewTypes,
    featuredArtistId,
    featuredSubmissionId,
  } = body;

  if (!title || !startTime || !endTime || !curatorId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  if (!Array.isArray(allowedViewTypes) || allowedViewTypes.length === 0) {
    return NextResponse.json(
      { error: "At least one view type must be selected" },
      { status: 400 },
    );
  }

  const validViewTypes = ["gallery", "constellation", "global"];
  const invalidTypes = allowedViewTypes.filter(
    (type: string) => !validViewTypes.includes(type),
  );
  if (invalidTypes.length > 0) {
    return NextResponse.json(
      { error: `Invalid view types: ${invalidTypes.join(", ")}` },
      { status: 400 },
    );
  }

  // Verify curator exists
  const curator = await prisma.user.findUnique({
    where: { id: curatorId },
  });

  if (!curator) {
    return NextResponse.json({ error: "Curator not found" }, { status: 404 });
  }

  const exhibit = await prisma.exhibit.create({
    data: {
      title,
      description: description || null,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isActive: isActive ?? true,
      curatorId,
      allowedViewTypes,
      featuredArtistId: featuredArtistId || null,
      featuredSubmissionId: featuredSubmissionId || null,
    },
    include: {
      curator: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  });

  return NextResponse.json({ exhibit });
}
