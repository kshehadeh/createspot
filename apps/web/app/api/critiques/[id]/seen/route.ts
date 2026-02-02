import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

  // Set seenAt to current timestamp if null
  const updatedCritique = await prisma.critique.update({
    where: { id },
    data: {
      seenAt: existingCritique.seenAt || new Date(),
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
