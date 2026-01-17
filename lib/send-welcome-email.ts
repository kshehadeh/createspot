import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { WelcomeEmail } from "@/emails/templates/welcome-email";
import { getEmailTranslations } from "./email/translations";

/**
 * Sends a welcome email to a user if they haven't received one yet.
 * This function is idempotent - it will only send the email once per user.
 *
 * @param userId - The user ID to send the welcome email to
 * @returns Promise<{ sent: boolean; error?: string }> - Whether the email was sent and any error
 */
export async function sendWelcomeEmailIfNeeded(
  userId: string,
): Promise<{ sent: boolean; error?: string }> {
  try {
    // Atomically update the flag to prevent duplicate sends
    // This uses updateMany with a where clause to ensure we only update if welcomeEmailSent is still false
    const updateResult = await prisma.user.updateMany({
      where: {
        id: userId,
        welcomeEmailSent: false,
      },
      data: {
        welcomeEmailSent: true,
      },
    });

    // If no rows were updated, the email was already sent
    if (updateResult.count === 0) {
      return { sent: false };
    }

    // Fetch user data for the email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        language: true,
      },
    });

    if (!user) {
      // Rollback the flag update if user not found
      await prisma.user.update({
        where: { id: userId },
        data: { welcomeEmailSent: false },
      });
      return { sent: false, error: "User not found" };
    }

    // Get the exhibition URL for the CTA
    const baseUrl = process.env.NEXTAUTH_URL || "https://create.spot";
    const ctaUrl = `${baseUrl}/exhibition`;

    // Load translations for the user's language
    const t = await getEmailTranslations(user.language, "email");

    // Get email subject from translations
    const emailSubject = t("welcome.subject", {
      appName: "Create Spot",
    });

    // Send the welcome email
    await sendEmail({
      to: user.email,
      subject: emailSubject,
      react: WelcomeEmail({
        name: user.name,
        ctaUrl,
        userId,
        baseUrl,
        t,
      }),
    });

    return { sent: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      "[Welcome Email] Error sending welcome email:",
      errorMessage,
      error,
    );

    // Try to rollback the flag update on error
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { welcomeEmailSent: false },
      });
    } catch (rollbackError) {
      console.error("[Welcome Email] Error rolling back flag:", rollbackError);
    }

    return { sent: false, error: errorMessage };
  }
}
