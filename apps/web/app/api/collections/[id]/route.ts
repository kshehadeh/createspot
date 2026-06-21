import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_COLLECTION_VIEW_TYPES = ["gallery", "sketchbook"] as const;
type CollectionViewType = (typeof VALID_COLLECTION_VIEW_TYPES)[number];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { id } = await params;

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      submissions: {
        orderBy: { order: "asc" },
        include: {
          submission: {
            include: {
              _count: {
                select: { favorites: true },
              },
            },
          },
        },
      },
      _count: {
        select: { submissions: true },
      },
    },
  });

  if (!collection) {
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 },
    );
  }

  // Check visibility
  const isOwner = session?.user?.id === collection.userId;
  if (!isOwner && !collection.isPublic) {
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ collection, isOwner });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const collection = await prisma.collection.findUnique({
    where: { id },
  });

  if (!collection) {
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 },
    );
  }

  if (collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { name, description, isPublic, defaultViewType } = body;

  const updateData: {
    name?: string;
    description?: string | null;
    isPublic?: boolean;
    defaultViewType?: CollectionViewType;
  } = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Collection name cannot be empty" },
        { status: 400 },
      );
    }
    updateData.name = name.trim();
  }

  if (description !== undefined) {
    updateData.description = description?.trim() || null;
  }

  if (isPublic !== undefined) {
    updateData.isPublic = Boolean(isPublic);
  }

  if (defaultViewType !== undefined) {
    if (typeof defaultViewType !== "string") {
      return NextResponse.json(
        { error: "Collection view type must be a string" },
        { status: 400 },
      );
    }

    const isValidViewType = (value: string): value is CollectionViewType =>
      VALID_COLLECTION_VIEW_TYPES.includes(value as CollectionViewType);

    if (!isValidViewType(defaultViewType)) {
      return NextResponse.json(
        { error: `Invalid view type: ${defaultViewType}` },
        { status: 400 },
      );
    }

    updateData.defaultViewType = defaultViewType;
  }

  const updatedCollection = await prisma.collection.update({
    where: { id },
    data: updateData,
    include: {
      _count: {
        select: { submissions: true },
      },
    },
  });

  return NextResponse.json({ collection: updatedCollection });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const collection = await prisma.collection.findUnique({
    where: { id },
  });

  if (!collection) {
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 },
    );
  }

  if (collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await prisma.collection.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
