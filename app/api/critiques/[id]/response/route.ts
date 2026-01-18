import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const { response } = body;

  if (
    !response ||
    typeof response !== "string" ||
    response.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "Response text is required" },
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

  // Only allow if user is the submission owner
  if (existingCritique.submission.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const updatedCritique = await prisma.critique.update({
    where: { id },
    data: {
      response,
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

  // Only allow if user is the submission owner
  if (existingCritique.submission.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const updatedCritique = await prisma.critique.update({
    where: { id },
    data: {
      response: null,
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
