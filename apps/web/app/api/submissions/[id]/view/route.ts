import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
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

  // Track view after response is sent
  after(async () => {
    try {
      if (viewerUserId) {
        // Logged-in user: first check if view already exists for this user
        const existingUserView = await prisma.submissionView.findUnique({
          where: {
            submissionId_viewerUserId: {
              submissionId,
              viewerUserId,
            },
          },
        });

        if (existingUserView) {
          // Update existing user view
          await prisma.submissionView.update({
            where: { id: existingUserView.id },
            data: {
              viewedAt: new Date(),
            },
          });
        } else {
          // Check if there's an anonymous view with same IP hash
          const existingAnonymousView = await prisma.submissionView.findUnique({
            where: {
              submissionId_viewerIpHash: {
                submissionId,
                viewerIpHash,
              },
            },
          });

          if (existingAnonymousView && !existingAnonymousView.viewerUserId) {
            // Delete anonymous view and create user view
            await prisma.$transaction([
              prisma.submissionView.delete({
                where: { id: existingAnonymousView.id },
              }),
              prisma.submissionView.create({
                data: {
                  submissionId,
                  viewerUserId,
                  viewerIpHash,
                  viewedAt: new Date(),
                },
              }),
            ]);
          } else {
            // Create new user view
            await prisma.submissionView.create({
              data: {
                submissionId,
                viewerUserId,
                viewerIpHash,
                viewedAt: new Date(),
              },
            });
          }
        }
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
    } catch (error) {
      console.error("Error tracking submission view:", error);
    }
  });

  return NextResponse.json({ success: true, tracked: true });
}
