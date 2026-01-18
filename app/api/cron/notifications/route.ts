import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNewPromptNotification } from "@/app/workflows/send-new-prompt-notification";

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: {
    newPromptNotifications: { promptId: string; status: string }[];
  } = {
    newPromptNotifications: [],
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

      // Trigger the workflow
      sendNewPromptNotification({ promptId: prompt.id })
        .then((result) => {
          console.log(
            `[Cron] New prompt notification workflow completed for prompt ${prompt.id}:`,
            result,
          );
        })
        .catch((error) => {
          console.error(
            `[Cron] Failed to send new prompt notification for prompt ${prompt.id}:`,
            error,
          );
        });

      results.newPromptNotifications.push({
        promptId: prompt.id,
        status: "triggered",
      });
    }

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
