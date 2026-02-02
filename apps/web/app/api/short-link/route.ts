import { NextRequest, NextResponse } from "next/server";
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
  // No auth required: short links are allowed for public content only (enforced below).
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
      select: { shareStatus: true },
    });
    if (!submission || submission.shareStatus === "PRIVATE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (type === "collection") {
    const collection = await prisma.collection.findUnique({
      where: { id: targetId },
      select: { isPublic: true },
    });
    if (!collection || !collection.isPublic) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (type === "exhibit") {
    const exhibit = await prisma.exhibit.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!exhibit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

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
