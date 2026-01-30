import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNewPromptNotification } from "@/app/workflows/send-new-prompt-notification";
import { checkBadgeAwards } from "@/app/workflows/check-badge-awards";

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: {
    newPromptNotifications: { promptId: string; status: string }[];
    badgeAwards: { status: string };
  } = {
    newPromptNotifications: [],
    badgeAwards: { status: "pending" },
  };

  try {
    // Find prompts that started within the last hour
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentlyStartedPrompts = await prisma.prompt.findMany({
      where: {
        weekStart: {
          gte: oneWeekAgo,
          lte: now,
        },
      },
    });

    for (const prompt of recentlyStartedPrompts) {
      // Check if we already sent a notification for this prompt
      const existingNotification = await prisma.notificationLog.findFirst({
        where: {
          type: "NEW_PROMPT",
          meta: {
            path: ["promptId"],
            equals: prompt.id,
          },
        },
      });

      if (existingNotification) {
        results.newPromptNotifications.push({
          promptId: prompt.id,
          status: "already_sent",
        });
        continue;
      }

      // Trigger the workflow after response is sent
      const promptIdToNotify = prompt.id;
      after(async () => {
        try {
          const result = await sendNewPromptNotification({
            promptId: promptIdToNotify,
          });
          console.log(
            `[Cron] New prompt notification workflow completed for prompt ${promptIdToNotify}:`,
            result,
          );
        } catch (error) {
          console.error(
            `[Cron] Failed to send new prompt notification for prompt ${promptIdToNotify}:`,
            error,
          );
        }
      });

      results.newPromptNotifications.push({
        promptId: prompt.id,
        status: "triggered",
      });
    }

    // Check and award badges after response is sent
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

    results.badgeAwards = { status: "triggered" };

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error("[Cron] Error in notifications cron job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
