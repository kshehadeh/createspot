import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCritiqueNotification } from "@/app/workflows/send-critique-notification";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      critiquesEnabled: true,
    },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  }

  const isCreator = session.user.id === submission.userId;

  // If user is creator, return all critiques with critiquer info
  // If user is critiquer, return only their critiques
  const critiques = await prisma.critique.findMany({
    where: {
      submissionId: id,
      ...(isCreator ? {} : { critiquerId: session.user.id }),
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
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ critiques });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      critiquesEnabled: true,
    },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  }

  if (!submission.critiquesEnabled) {
    return NextResponse.json(
      { error: "Critiques are not enabled for this submission" },
      { status: 400 },
    );
  }

  // Prevent self-critique
  if (session.user.id === submission.userId) {
    return NextResponse.json(
      { error: "Cannot critique your own submission" },
      { status: 400 },
    );
  }

  // Create the critique
  const newCritique = await prisma.critique.create({
    data: {
      submissionId: id,
      critiquerId: session.user.id,
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

  // Send email notification to creator (async, don't wait)
  sendCritiqueNotification({
    critiquerId: session.user.id,
    submissionId: id,
  }).catch((error) => {
    console.error("Failed to send critique notification:", error);
  });

  return NextResponse.json({ critique: newCritique });
}
