import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { blockedId } = body;

  if (!blockedId) {
    return NextResponse.json(
      { error: "blockedId is required" },
      { status: 400 },
    );
  }

  // Cannot block yourself
  if (blockedId === session.user.id) {
    return NextResponse.json(
      { error: "Cannot block yourself" },
      { status: 400 },
    );
  }

  // Check that the target user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: blockedId },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const block = await prisma.block.upsert({
    where: {
      blockerId_blockedId: {
        blockerId: session.user.id,
        blockedId,
      },
    },
    create: {
      blockerId: session.user.id,
      blockedId,
    },
    update: {},
  });

  return NextResponse.json({ block });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const blockedId = searchParams.get("blockedId");

  if (!blockedId) {
    return NextResponse.json(
      { error: "blockedId is required" },
      { status: 400 },
    );
  }

  await prisma.block.deleteMany({
    where: {
      blockerId: session.user.id,
      blockedId,
    },
  });

  return NextResponse.json({ success: true });
}
