import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const exhibit = await prisma.exhibit.findUnique({
    where: { id },
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
      submissions: {
        include: {
          submission: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
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
          },
        },
        orderBy: {
          order: "asc",
        },
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  });

  if (!exhibit) {
    return NextResponse.json({ error: "Exhibit not found" }, { status: 404 });
  }

  return NextResponse.json({ exhibit });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
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

  // Verify exhibit exists
  const existingExhibit = await prisma.exhibit.findUnique({
    where: { id },
  });

  if (!existingExhibit) {
    return NextResponse.json({ error: "Exhibit not found" }, { status: 404 });
  }

  // Validate allowedViewTypes if provided
  if (allowedViewTypes !== undefined) {
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
  }

  // Verify curator exists if provided
  if (curatorId) {
    const curator = await prisma.user.findUnique({
      where: { id: curatorId },
    });

    if (!curator) {
      return NextResponse.json({ error: "Curator not found" }, { status: 404 });
    }
  }

  const updateData: {
    title?: string;
    description?: string | null;
    startTime?: Date;
    endTime?: Date;
    isActive?: boolean;
    curatorId?: string;
    allowedViewTypes?: string[];
    featuredArtistId?: string | null;
    featuredSubmissionId?: string | null;
  } = {};

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description || null;
  if (startTime !== undefined) updateData.startTime = new Date(startTime);
  if (endTime !== undefined) updateData.endTime = new Date(endTime);
  if (isActive !== undefined) updateData.isActive = isActive;
  if (curatorId !== undefined) updateData.curatorId = curatorId;
  if (allowedViewTypes !== undefined)
    updateData.allowedViewTypes = allowedViewTypes;
  if (featuredArtistId !== undefined)
    updateData.featuredArtistId = featuredArtistId || null;
  if (featuredSubmissionId !== undefined)
    updateData.featuredSubmissionId = featuredSubmissionId || null;

  const exhibit = await prisma.exhibit.update({
    where: { id },
    data: updateData,
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
  });

  return NextResponse.json({ exhibit });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify exhibit exists
  const exhibit = await prisma.exhibit.findUnique({
    where: { id },
  });

  if (!exhibit) {
    return NextResponse.json({ error: "Exhibit not found" }, { status: 404 });
  }

  await prisma.exhibit.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
