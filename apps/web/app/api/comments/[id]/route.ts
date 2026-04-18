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
  const { body: commentBody } = body;

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

  const existingComment = await prisma.comment.findUnique({
    where: { id },
    include: {
      submission: {
        select: { userId: true },
      },
    },
  });

  if (!existingComment || existingComment.deletedAt) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (existingComment.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Only allow edits within 15 minutes
  const editWindowMs = 15 * 60 * 1000;
  const timeSinceCreation = Date.now() - existingComment.createdAt.getTime();
  if (timeSinceCreation > editWindowMs) {
    return NextResponse.json(
      { error: "Cannot edit comment after 15 minutes" },
      { status: 400 },
    );
  }

  const updatedComment = await prisma.comment.update({
    where: { id },
    data: { body: commentBody.trim() },
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

  return NextResponse.json({ comment: updatedComment });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingComment = await prisma.comment.findUnique({
    where: { id },
    include: {
      submission: {
        select: { userId: true },
      },
    },
  });

  if (!existingComment || existingComment.deletedAt) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const isCommenter = existingComment.userId === session.user.id;
  const isSubmissionOwner =
    existingComment.submission.userId === session.user.id;

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });
  const isAdmin = user?.isAdmin ?? false;

  if (!isCommenter && !isSubmissionOwner && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Soft delete to preserve thread structure
  await prisma.comment.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
