import { prisma } from "@/lib/prisma";

interface SendBadgeAwardEmailInput {
  userId: string;
  badgeKey: string;
  awardId: string;
}

export async function sendBadgeAwardEmail(
  input: SendBadgeAwardEmailInput,
): Promise<void> {
  "use step";
  const { userId, badgeKey, awardId } = input;

  const { badgeDefinitionsByKey } = await import("@/lib/badges");

  const badge =
    badgeDefinitionsByKey[badgeKey as keyof typeof badgeDefinitionsByKey];
  if (!badge) {
    console.warn("[BadgeAwards] Unknown badge key", badgeKey);
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      language: true,
      emailOnBadgeAward: true,
      name: true,
    },
  });

  if (!user?.email) {
    console.log("[BadgeAwards] User has no email, skipping", { userId });
    return;
  }

  if (!user.emailOnBadgeAward) {
    console.log("[BadgeAwards] User disabled badge emails, skipping", {
      userId,
    });
    return;
  }

  const baseUrl = process.env.NEXTAUTH_URL || "https://prompts.art";
  const profileUrl = `${baseUrl}/profile/${userId}`;

  const { sendEmail } = await import("@/lib/email");
  const { getEmailTranslations } = await import("@/lib/email/translations");
  const { BadgeAwardEmail } = await import(
    "@/emails/templates/badge-award-email"
  );

  const t = await getEmailTranslations(user.language, "email");

  const emailComponent = BadgeAwardEmail({
    badgeName: badge.name,
    badgeDescription: badge.description,
    badgeImage: badge.image,
    profileUrl,
    baseUrl,
    userId,
    t,
  });

  const subject = t("badgeAward.subject", { badgeName: badge.name });

  try {
    await sendEmail({
      to: user.email,
      subject,
      react: emailComponent,
    });

    // Update badge award with notification timestamp
    await prisma.badgeAward.update({
      where: { id: awardId },
      data: { notifiedAt: new Date() },
    });

    // Log the notification
    try {
      await prisma.notificationLog.create({
        data: {
          type: "BADGE_AWARDED",
          meta: { badgeKey },
          userId,
        },
      });
      console.log(
        "[BadgeAwards] Notification log created for badge:",
        badgeKey,
        "user:",
        userId,
      );
    } catch (logError) {
      // Log error but don't fail the whole operation if notification log fails
      console.error(
        "[BadgeAwards] Failed to create notification log:",
        logError,
      );
    }
  } catch (error) {
    // Extract detailed error information
    const { EmailSendError } = await import("@/lib/email/email-service");
    let errorDetails: string;

    if (error instanceof EmailSendError) {
      const metadata = error.metadata || {};
      const cause = error.cause;
      errorDetails = [
        error.message,
        metadata.name ? `Error name: ${metadata.name}` : null,
        metadata.statusCode ? `Status code: ${metadata.statusCode}` : null,
        cause instanceof Error ? `Cause: ${cause.message}` : null,
        cause && typeof cause === "object" && "status" in cause
          ? `HTTP status: ${cause.status}`
          : null,
        cause && typeof cause === "object" && "response" in cause
          ? `Response: ${JSON.stringify(cause.response)}`
          : null,
      ]
        .filter(Boolean)
        .join(", ");
    } else {
      errorDetails = error instanceof Error ? error.message : "Unknown error";
    }

    console.error("[BadgeAwards] Failed to send badge email:", {
      userId,
      badgeKey,
      email: user.email,
      error: errorDetails,
      fullError: error,
    });

    throw new Error(`Failed to send badge email: ${errorDetails}`);
  }
}
