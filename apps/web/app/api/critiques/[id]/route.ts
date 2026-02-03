import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFragment } from "@/lib/r2-fragments";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { critique } = body;

  if (
    !critique ||
    typeof critique !== "string" ||
    critique.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "Critique text is required" },
      { status: 400 },
    );
  }

  const existingCritique = await prisma.critique.findUnique({
    where: { id },
    include: {
      submission: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!existingCritique) {
    return NextResponse.json({ error: "Critique not found" }, { status: 404 });
  }

  // Only allow if user is the critiquer
  if (existingCritique.critiquerId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Only allow if unseen
  if (existingCritique.seenAt !== null) {
    return NextResponse.json(
      { error: "Cannot edit critique after creator has seen it" },
      { status: 400 },
    );
  }

  const updatedCritique = await prisma.critique.update({
    where: { id },
    data: {
      critique,
    },
    include: {
      critiquer: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  return NextResponse.json({ critique: updatedCritique });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingCritique = await prisma.critique.findUnique({
    where: { id },
    include: {
      submission: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!existingCritique) {
    return NextResponse.json({ error: "Critique not found" }, { status: 404 });
  }

  const isCritiquer = existingCritique.critiquerId === session.user.id;
  const isCreator = existingCritique.submission.userId === session.user.id;

  // Allow if user is the critiquer OR the creator
  if (!isCritiquer && !isCreator) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // If critiquer is deleting, only allow if unseen
  if (isCritiquer && existingCritique.seenAt !== null) {
    return NextResponse.json(
      { error: "Cannot delete critique after creator has seen it" },
      { status: 400 },
    );
  }

  // Creator can always delete (no restrictions)

  // Delete fragment if it exists
  if (
    existingCritique.selectionData &&
    typeof existingCritique.selectionData === "object" &&
    "type" in existingCritique.selectionData &&
    existingCritique.selectionData.type === "image" &&
    "fragmentUrl" in existingCritique.selectionData &&
    typeof existingCritique.selectionData.fragmentUrl === "string"
  ) {
    try {
      await deleteFragment(existingCritique.selectionData.fragmentUrl);
    } catch (error) {
      console.error("Failed to delete fragment:", error);
      // Continue with critique deletion even if fragment deletion fails
    }
  }

  await prisma.critique.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
