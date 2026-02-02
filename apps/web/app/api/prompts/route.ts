import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const prompt = await prisma.prompt.findFirst({
    where: {
      weekStart: { lte: new Date() },
      weekEnd: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ prompt });
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { word1, word2, word3, weekStart, weekEnd } = body;

  if (!word1 || !word2 || !word3 || !weekStart) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const startDate = new Date(weekStart);
  // Ensure start is at 00:00:00.000
  startDate.setUTCHours(0, 0, 0, 0);

  const endDate = weekEnd
    ? new Date(weekEnd)
    : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  // Ensure end is at 23:59:59.999
  endDate.setUTCHours(23, 59, 59, 999);

  const prompt = await prisma.prompt.create({
    data: {
      word1,
      word2,
      word3,
      weekStart: startDate,
      weekEnd: endDate,
      createdByUserId: session.user.id,
    },
  });

  return NextResponse.json({ prompt });
}

export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, word1, word2, word3, weekStart, weekEnd } = body;

  if (!id) {
    return NextResponse.json(
      { error: "Prompt ID is required" },
      { status: 400 },
    );
  }

  const existingPrompt = await prisma.prompt.findUnique({
    where: { id },
    include: {
      _count: {
        select: { submissions: true },
      },
    },
  });

  if (!existingPrompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  if (existingPrompt._count.submissions > 0) {
    return NextResponse.json(
      { error: "Cannot edit a prompt that has submissions" },
      { status: 400 },
    );
  }

  const updateData: Record<string, unknown> = {};
  if (word1) updateData.word1 = word1;
  if (word2) updateData.word2 = word2;
  if (word3) updateData.word3 = word3;
  if (weekStart) {
    const startDate = new Date(weekStart);
    startDate.setUTCHours(0, 0, 0, 0);
    updateData.weekStart = startDate;
  }
  if (weekEnd) {
    const endDate = new Date(weekEnd);
    endDate.setUTCHours(23, 59, 59, 999);
    updateData.weekEnd = endDate;
  }

  const prompt = await prisma.prompt.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ prompt });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Prompt ID is required" },
      { status: 400 },
    );
  }

  const existingPrompt = await prisma.prompt.findUnique({
    where: { id },
    include: {
      _count: {
        select: { submissions: true },
      },
    },
  });

  if (!existingPrompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  if (existingPrompt._count.submissions > 0) {
    return NextResponse.json(
      { error: "Cannot delete a prompt that has submissions" },
      { status: 400 },
    );
  }

  await prisma.prompt.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
