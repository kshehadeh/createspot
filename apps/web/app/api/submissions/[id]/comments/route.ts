import { after, NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCommentNotification } from "@/app/(app)/workflows/send-comment-notification";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      commentsEnabled: true,
      shareStatus: true,
    },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  }

  if (!submission.commentsEnabled) {
    return NextResponse.json(
      { error: "Comments are not enabled for this submission" },
      { status: 403 },
    );
  }

  // Private submissions only visible to owner
  if (submission.shareStatus === "PRIVATE") {
    if (!session?.user || session.user.id !== submission.userId) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const take = Math.min(
    Math.max(Number(url.searchParams.get("take") || 20), 1),
    50,
  );

  // Get blocked user IDs for filtering
  let blockedIds: Set<string> = new Set();
  if (session?.user) {
    const [blocked, blockedBy] = await Promise.all([
      prisma.block.findMany({
        where: { blockerId: session.user.id },
        select: { blockedId: true },
      }),
      prisma.block.findMany({
        where: { blockedId: session.user.id },
        select: { blockerId: true },
      }),
    ]);
    blockedIds = new Set([
      ...blocked.map((b) => b.blockedId),
      ...blockedBy.map((b) => b.blockerId),
    ]);
  }

  const comments = await prisma.comment.findMany({
    where: {
      submissionId: id,
      // Include soft-deleted comments so the tree structure is preserved,
      // but filter out non-deleted comments from blocked users
      ...(blockedIds.size > 0
        ? {
            OR: [
              { deletedAt: { not: null } }, // always include deleted (no user info shown)
              {
                deletedAt: null,
                userId: { notIn: Array.from(blockedIds) },
              }, // non-deleted from non-blocked users
            ],
          }
        : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          profileImageUrl: true,
          slug: true,
        },
      },
      _count: {
        select: { replies: { where: { deletedAt: null } } },
      },
    },
    orderBy: { createdAt: "asc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = comments.length > take;
  const trimmed = hasMore ? comments.slice(0, take) : comments;

  return NextResponse.json({
    comments: trimmed,
    hasMore,
    nextCursor:
      hasMore && trimmed.length > 0 ? trimmed[trimmed.length - 1].id : null,
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { body: commentBody, parentId } = body;

  if (
    !commentBody ||
    typeof commentBody !== "string" ||
    commentBody.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "Comment text is required" },
      { status: 400 },
    );
  }

  if (commentBody.length > 2000) {
    return NextResponse.json(
      { error: "Comment must be 2000 characters or fewer" },
      { status: 400 },
    );
  }

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      commentsEnabled: true,
    },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  }

  if (!submission.commentsEnabled) {
    return NextResponse.json(
      { error: "Comments are not enabled for this submission" },
      { status: 403 },
    );
  }

  // Check block relationships
  if (session.user.id !== submission.userId) {
    const blockExists = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: session.user.id, blockedId: submission.userId },
          { blockerId: submission.userId, blockedId: session.user.id },
        ],
      },
    });
    if (blockExists) {
      return NextResponse.json(
        { error: "Cannot comment on this submission" },
        { status: 403 },
      );
    }
  }

  // Validate parentId if provided
  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { submissionId: true, deletedAt: true },
    });

    if (!parentComment || parentComment.submissionId !== id) {
      return NextResponse.json(
        { error: "Parent comment not found" },
        { status: 404 },
      );
    }

    if (parentComment.deletedAt) {
      return NextResponse.json(
        { error: "Cannot reply to a deleted comment" },
        { status: 400 },
      );
    }
  }

  const comment = await prisma.comment.create({
    data: {
      submissionId: id,
      userId: session.user.id,
      parentId: parentId || null,
      body: commentBody.trim(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          profileImageUrl: true,
          slug: true,
        },
      },
      _count: {
        select: { replies: true },
      },
    },
  });

  // Send notification to submission owner after response
  after(async () => {
    try {
      await sendCommentNotification({
        commenterId: session.user.id,
        submissionId: id,
      });
    } catch (error) {
      console.error("Failed to send comment notification:", error);
    }
  });

  return NextResponse.json({ comment }, { status: 201 });
}
