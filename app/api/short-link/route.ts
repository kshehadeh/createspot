import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getOrCreateShortLink,
  type ShortLinkTargetType,
} from "@/lib/short-url";

const VALID_TYPES: ShortLinkTargetType[] = [
  "submission",
  "collection",
  "exhibit",
];

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") as ShortLinkTargetType | null;
  const targetId = searchParams.get("targetId");

  if (!type || !VALID_TYPES.includes(type) || !targetId) {
    return NextResponse.json(
      { error: "Missing or invalid type or targetId" },
      { status: 400 },
    );
  }

  if (type === "submission") {
    const submission = await prisma.submission.findUnique({
      where: { id: targetId },
      select: { userId: true },
    });
    if (!submission || submission.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (type === "collection") {
    const collection = await prisma.collection.findUnique({
      where: { id: targetId },
      select: { userId: true },
    });
    if (!collection || collection.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  // exhibit: shareable by anyone (public content), no ownership check

  const code = await getOrCreateShortLink(type, targetId);
  if (!code) {
    return NextResponse.json(
      { error: "Failed to create short link" },
      { status: 500 },
    );
  }

  const baseUrl =
    process.env.NEXTAUTH_URL ||
    request.nextUrl.origin ||
    "http://localhost:3000";
  const shortUrl = `${baseUrl.replace(/\/$/, "")}/s/${code}`;

  return NextResponse.json({ code, shortUrl });
}
