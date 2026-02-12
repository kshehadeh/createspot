import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(
    Number.parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) ||
      DEFAULT_LIMIT,
    MAX_LIMIT,
  );

  if (type !== "followers" && type !== "following" && type !== "blocked") {
    return NextResponse.json(
      { error: "type must be 'followers', 'following', or 'blocked'" },
      { status: 400 },
    );
  }

  const userId = session.user.id;

  if (type === "blocked") {
    const blocks = await prisma.block.findMany({
      where: { blockerId: userId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
            image: true,
            profileImageUrl: true,
            slug: true,
          },
        },
      },
    });

    const hasMore = blocks.length > limit;
    const items = hasMore ? blocks.slice(0, limit) : blocks;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({
      items: items.map((b) => ({
        id: b.blocked.id,
        name: b.blocked.name,
        image: b.blocked.image,
        profileImageUrl: b.blocked.profileImageUrl,
        slug: b.blocked.slug,
      })),
      nextCursor,
      hasMore,
    });
  }

  if (type === "following") {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            image: true,
            profileImageUrl: true,
            slug: true,
          },
        },
      },
    });

    const hasMore = follows.length > limit;
    const items = hasMore ? follows.slice(0, limit) : follows;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({
      items: items.map((f) => ({
        id: f.following.id,
        name: f.following.name,
        image: f.following.image,
        profileImageUrl: f.following.profileImageUrl,
        slug: f.following.slug,
      })),
      nextCursor,
      hasMore,
    });
  }

  // type === "followers"
  const follows = await prisma.follow.findMany({
    where: { followingId: userId },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      follower: {
        select: {
          id: true,
          name: true,
          image: true,
          profileImageUrl: true,
          slug: true,
        },
      },
    },
  });

  const followerIds = follows.map((f) => f.follower.id);
  const blockedByMe = await prisma.block.findMany({
    where: {
      blockerId: userId,
      blockedId: { in: followerIds },
    },
    select: { blockedId: true },
  });
  const blockedSet = new Set(blockedByMe.map((b) => b.blockedId));

  const hasMore = follows.length > limit;
  const items = hasMore ? follows.slice(0, limit) : follows;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return NextResponse.json({
    items: items.map((f) => ({
      id: f.follower.id,
      name: f.follower.name,
      image: f.follower.image,
      profileImageUrl: f.follower.profileImageUrl,
      slug: f.follower.slug,
      isBlocked: blockedSet.has(f.follower.id),
    })),
    nextCursor,
    hasMore,
  });
}
