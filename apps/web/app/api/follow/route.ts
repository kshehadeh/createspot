import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNewFollowerNotification } from "@/app/workflows/send-new-follower-notification";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const followingId = searchParams.get("followingId");

  if (!followingId) {
    return NextResponse.json(
      { error: "followingId is required" },
      { status: 400 },
    );
  }

  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId,
      },
    },
  });

  return NextResponse.json({ isFollowing: !!follow });
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { followingId } = body;

  if (!followingId) {
    return NextResponse.json(
      { error: "followingId is required" },
      { status: 400 },
    );
  }

  // Cannot follow yourself
  if (followingId === session.user.id) {
    return NextResponse.json(
      { error: "Cannot follow yourself" },
      { status: 400 },
    );
  }

  // Check that the target user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: followingId },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // If the target user has blocked the current user, they cannot follow
  const blocked = await prisma.block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: followingId,
        blockedId: session.user.id,
      },
    },
  });

  if (blocked) {
    return NextResponse.json(
      { error: "Cannot follow this user" },
      { status: 403 },
    );
  }

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId,
      },
    },
  });

  const follow = await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId,
      },
    },
    create: {
      followerId: session.user.id,
      followingId,
    },
    update: {},
  });

  if (!existingFollow) {
    after(async () => {
      try {
        await sendNewFollowerNotification({
          followerId: session.user.id,
          followingId,
        });
      } catch (err) {
        console.error("[send-new-follower-notification]", err);
      }
    });
  }

  return NextResponse.json({ follow });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const followingId = searchParams.get("followingId");

  if (!followingId) {
    return NextResponse.json(
      { error: "followingId is required" },
      { status: 400 },
    );
  }

  await prisma.follow.deleteMany({
    where: {
      followerId: session.user.id,
      followingId,
    },
  });

  return NextResponse.json({ success: true });
}
