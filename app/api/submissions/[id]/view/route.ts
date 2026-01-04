import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: submissionId } = await params;

  // Check if submission exists
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { userId: true, shareStatus: true },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  }

  const session = await auth();
  const viewerUserId = session?.user?.id || null;
  const clientIp = getClientIp(request);
  const viewerIpHash = hashIp(clientIp);

  // Check share status visibility
  // PRIVATE submissions can only be viewed by the owner
  if (submission.shareStatus === "PRIVATE") {
    if (!viewerUserId || viewerUserId !== submission.userId) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }
  }

  // Don't track views on own submissions
  if (viewerUserId === submission.userId) {
    return NextResponse.json({ success: true, tracked: false });
  }

  try {
    // Try to upsert based on user ID first (if logged in)
    if (viewerUserId) {
      await prisma.submissionView.upsert({
        where: {
          submissionId_viewerUserId: {
            submissionId,
            viewerUserId,
          },
        },
        update: {
          viewedAt: new Date(),
        },
        create: {
          submissionId,
          viewerUserId,
          viewerIpHash,
        },
      });
    } else {
      // Anonymous user - track by IP hash
      await prisma.submissionView.upsert({
        where: {
          submissionId_viewerIpHash: {
            submissionId,
            viewerIpHash,
          },
        },
        update: {
          viewedAt: new Date(),
        },
        create: {
          submissionId,
          viewerUserId: null,
          viewerIpHash,
        },
      });
    }

    return NextResponse.json({ success: true, tracked: true });
  } catch (error) {
    console.error("Error tracking submission view:", error);
    // Don't fail the request if tracking fails
    return NextResponse.json({ success: true, tracked: false });
  }
}
