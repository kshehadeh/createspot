import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { checkBadgeAwards } from "@/app/(app)/workflows/check-badge-awards";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  try {
    after(async () => {
      try {
        const result = await checkBadgeAwards({});
        console.log(
          "[Cron] Badge award check workflow completed. Awarded:",
          result.awardedCount,
          "Errors:",
          result.errors.length,
        );
        if (result.errors.length > 0) {
          console.error("[Cron] Badge award errors:", result.errors);
        }
      } catch (error) {
        console.error("[Cron] Badge award check workflow failed:", error);
      }
    });

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results: {
        badgeAwards: { status: "triggered" },
      },
    });
  } catch (error) {
    console.error("[Cron] Error in notifications cron job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
