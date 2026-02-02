import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidSlugFormat } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const userId = searchParams.get("userId");

  // Validate userId matches session
  if (userId && userId !== session.user.id) {
    return NextResponse.json({ error: "User ID mismatch" }, { status: 403 });
  }

  const currentUserId = userId || session.user.id;

  // If slug is empty, it's valid (will use ID fallback)
  if (!slug || slug.trim() === "") {
    return NextResponse.json({
      available: true,
      message: "Empty slug is allowed (will use ID fallback)",
    });
  }

  const trimmedSlug = slug.trim();

  // Validate format
  if (!isValidSlugFormat(trimmedSlug)) {
    return NextResponse.json({
      available: false,
      message:
        "Slug can only contain lowercase letters, numbers, and hyphens. It cannot start or end with a hyphen.",
    });
  }

  // Check if this is the user's current slug
  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { slug: true },
  });

  if (currentUser?.slug === trimmedSlug) {
    return NextResponse.json({
      available: true,
      message: "This is your current slug",
    });
  }

  // Check uniqueness
  const existingUser = await prisma.user.findUnique({
    where: { slug: trimmedSlug },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json({
      available: false,
      message: "This slug is already taken",
    });
  }

  return NextResponse.json({
    available: true,
    message: "This slug is available",
  });
}
