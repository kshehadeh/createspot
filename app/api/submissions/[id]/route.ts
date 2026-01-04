import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
) {
  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          instagram: true,
          twitter: true,
          linkedin: true,
          website: true,
        },
      },
      prompt: {
        select: {
          id: true,
          word1: true,
          word2: true,
          word3: true,
          weekStart: true,
          weekEnd: true,
        },
      },
      _count: {
        select: {
          favorites: true,
        },
      },
    },
  });

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  return NextResponse.json({ submission });
}





