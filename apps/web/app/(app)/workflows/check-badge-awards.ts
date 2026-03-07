"use workflow";

export interface CheckBadgeAwardsInput {
  // No input needed for this workflow, but keeping interface for consistency
}

interface UserData {
  id: string;
  email: string;
}

async function fetchAllUsers(): Promise<UserData[]> {
  "use step";

  console.log("[Workflow] fetchAllUsers called");

  const { prisma } = await import("@/lib/prisma");

  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  });

  console.log("[Workflow] Found", users.length, "users");

  return users;
}

async function checkBadgeEligibility(
  userId: string,
  badgeKey: string,
): Promise<{ eligible: boolean; alreadyAwarded: boolean }> {
  "use step";

  const { badgeDefinitions } = await import("@/lib/badges");
  const { prisma } = await import("@/lib/prisma");

  const badge = badgeDefinitions.find((b) => b.key === badgeKey);
  if (!badge) {
    return { eligible: false, alreadyAwarded: false };
  }

  const alreadyAwarded = await prisma.badgeAward.findFirst({
    where: { userId, badgeKey },
    select: { id: true },
  });

  if (alreadyAwarded) {
    return { eligible: false, alreadyAwarded: true };
  }

  const eligible = await badge.isEligible(userId, prisma);

  return { eligible, alreadyAwarded: false };
}

async function awardBadge(
  userId: string,
  badgeKey: string,
): Promise<{ success: boolean; awardId?: string; error?: string }> {
  "use step";

  console.log(
    "[Workflow] awardBadge called for user:",
    userId,
    "badge:",
    badgeKey,
  );

  const { prisma } = await import("@/lib/prisma");

  try {
    const created = await prisma.badgeAward.create({
      data: { userId, badgeKey },
    });

    console.log("[Workflow] Badge awarded:", created.id);
    return { success: true, awardId: created.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Workflow] Error awarding badge:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

async function sendBadgeEmail(
  userId: string,
  badgeKey: string,
  awardId: string,
): Promise<{ success: boolean; error?: string }> {
  "use step";

  console.log(
    "[Workflow] sendBadgeEmail called for user:",
    userId,
    "badge:",
    badgeKey,
  );

  const { sendBadgeAwardEmail } = await import("@/lib/notifications/badges");

  try {
    await sendBadgeAwardEmail({
      userId,
      badgeKey,
      awardId,
    });

    console.log("[Workflow] Badge email sent successfully");
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      "[Workflow] Error sending badge email:",
      errorMessage,
      "Full error:",
      error,
    );
    return { success: false, error: errorMessage };
  }
}

export async function checkBadgeAwards(
  _input?: CheckBadgeAwardsInput,
): Promise<{
  success: boolean;
  awardedCount: number;
  errors: string[];
}> {
  console.log("[Workflow] checkBadgeAwards started");

  const { badgeDefinitions } = await import("@/lib/badges");

  const users = await fetchAllUsers();

  let awardedCount = 0;
  const errors: string[] = [];

  for (const user of users) {
    for (const badge of badgeDefinitions) {
      const { eligible, alreadyAwarded } = await checkBadgeEligibility(
        user.id,
        badge.key,
      );

      if (alreadyAwarded || !eligible) {
        continue;
      }

      console.log("[Workflow] Awarding badge", badge.key, "to user", user.id);

      const awardResult = await awardBadge(user.id, badge.key);

      if (!awardResult.success) {
        errors.push(
          `User ${user.id}, badge ${badge.key}: ${awardResult.error}`,
        );
        continue;
      }

      if (awardResult.awardId) {
        const emailResult = await sendBadgeEmail(
          user.id,
          badge.key,
          awardResult.awardId,
        );

        if (!emailResult.success && emailResult.error) {
          errors.push(
            `User ${user.id}, badge ${badge.key} email: ${emailResult.error}`,
          );
        }

        // Add delay between email sends to avoid rate limiting
        // Resend rate limit: 2 requests per second = 500ms minimum delay
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      awardedCount++;
    }
  }

  console.log(
    "[Workflow] checkBadgeAwards completed. Awarded:",
    awardedCount,
    "Errors:",
    errors.length,
  );

  return {
    success: true,
    awardedCount,
    errors,
  };
}
