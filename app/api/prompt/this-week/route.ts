import { NextRequest, NextResponse } from "next/server";
import { getPromptSubmissions } from "@/lib/prompts";
import { EXHIBITION_PAGE_SIZE } from "@/lib/exhibition-constants";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const promptId = searchParams.get("promptId");
  if (!promptId) {
    return NextResponse.json(
      { error: "promptId is required" },
      { status: 400 },
    );
  }

  const skip = Math.max(parseInt(searchParams.get("skip") || "0", 10), 0);
  const takeRaw = parseInt(
    searchParams.get("take") || `${EXHIBITION_PAGE_SIZE}`,
    10,
  );
  const take = Number.isFinite(takeRaw) ? takeRaw : EXHIBITION_PAGE_SIZE;

  const { submissions, hasMore } = await getPromptSubmissions(
    promptId,
    skip,
    take,
  );

  return NextResponse.json({ submissions, hasMore });
}
