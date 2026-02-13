import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { EXHIBITION_PAGE_SIZE } from "@/lib/exhibition-constants";
import { getFollowingFeedSubmissions } from "@/lib/community";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const skip = Math.max(parseInt(searchParams.get("skip") || "0", 10), 0);
  const takeRaw = parseInt(
    searchParams.get("take") || `${EXHIBITION_PAGE_SIZE}`,
    10,
  );
  const take = Number.isFinite(takeRaw) ? takeRaw : EXHIBITION_PAGE_SIZE;

  const { submissions, hasMore } = await getFollowingFeedSubmissions({
    userId: session.user.id,
    skip,
    take,
  });

  return NextResponse.json({ submissions, hasMore });
}
