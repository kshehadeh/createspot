import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFollowingFeedSubmissionsCursor } from "@/lib/feed";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;

  const cursor = searchParams.get("cursor") || undefined;
  const takeParam = searchParams.get("take");
  const take = takeParam ? Math.min(parseInt(takeParam, 10), 50) : 20;

  const { submissions, hasMore, nextCursor } =
    await getFollowingFeedSubmissionsCursor({
      cursor,
      take,
      currentUserId: session.user.id,
    });

  return NextResponse.json({ submissions, hasMore, nextCursor });
}
