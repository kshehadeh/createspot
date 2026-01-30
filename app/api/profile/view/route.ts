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

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { profileUserId } = body;

  if (!profileUserId) {
    return NextResponse.json(
      { error: "Profile user ID is required" },
      { status: 400 },
    );
  }

  // Check if profile exists
  const profileUser = await prisma.user.findUnique({
    where: { id: profileUserId },
  });

  if (!profileUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const session = await auth();
  const viewerUserId = session?.user?.id || null;
  const clientIp = getClientIp(request);
  const viewerIpHash = hashIp(clientIp);

  // Don't track views on own profile
  if (viewerUserId === profileUserId) {
    return NextResponse.json({ success: true, tracked: false });
  }

  // Track view after response is sent
  after(async () => {
    try {
      // Try to upsert based on user ID first (if logged in)
      if (viewerUserId) {
        await prisma.profileView.upsert({
          where: {
            profileUserId_viewerUserId: {
              profileUserId,
              viewerUserId,
            },
          },
          update: {
            viewedAt: new Date(),
          },
          create: {
            profileUserId,
            viewerUserId,
            viewerIpHash,
          },
        });
      } else {
        // Anonymous user - track by IP hash
        await prisma.profileView.upsert({
          where: {
            profileUserId_viewerIpHash: {
              profileUserId,
              viewerIpHash,
            },
          },
          update: {
            viewedAt: new Date(),
          },
          create: {
            profileUserId,
            viewerUserId: null,
            viewerIpHash,
          },
        });
      }
    } catch (error) {
      console.error("Error tracking profile view:", error);
    }
  });

  return NextResponse.json({ success: true, tracked: true });
}
