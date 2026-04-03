import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFeedSubmissions } from "@/lib/feed";

export async function GET(request: NextRequest) {
  const session = await auth();
  const searchParams = request.nextUrl.searchParams;

  const cursor = searchParams.get("cursor") || undefined;
  const takeParam = searchParams.get("take");
  const take = takeParam ? Math.min(parseInt(takeParam, 10), 50) : 20;

  const { submissions, hasMore, nextCursor } = await getFeedSubmissions({
    cursor,
    take,
    currentUserId: session?.user?.id,
  });

  return NextResponse.json({ submissions, hasMore, nextCursor });
}
