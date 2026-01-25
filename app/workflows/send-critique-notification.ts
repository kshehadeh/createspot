"use workflow";

export interface SendCritiqueNotificationInput {
  critiquerId: string;
  submissionId: string;
}

interface SubmissionData {
  id: string;
  title: string | null;
  userId: string;
  user: {
    email: string;
    name: string | null;
    emailOnFavorite: boolean;
    language: string;
  };
}

interface CritiquerData {
  id: string;
  name: string | null;
}

async function fetchSubmissionAndCritiquer(
  submissionId: string,
  critiquerId: string,
): Promise<{
  submission: SubmissionData | null;
  critiquer: CritiquerData | null;
}> {
  "use step";

  console.log(
    "[Workflow] fetchSubmissionAndCritiquer called with submissionId:",
    submissionId,
    "critiquerId:",
    critiquerId,
  );

  const { prisma } = await import("@/lib/prisma");

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { user: true },
  });

  console.log(
    "[Workflow] Submission found:",
    submission
      ? {
          id: submission.id,
          title: submission.title,
          userId: submission.userId,
        }
      : null,
  );

  const critiquer = await prisma.user.findUnique({
    where: { id: critiquerId },
  });

  console.log(
    "[Workflow] Critiquer found:",
    critiquer ? { id: critiquer.id, name: critiquer.name } : null,
  );

  return { submission, critiquer };
}

async function sendNotificationEmail(
  critiquerName: string | null,
  submissionTitle: string | null,
  submissionUrl: string,
  critiquerProfileUrl: string,
  recipientEmail: string,
  userLanguage: string,
  baseUrl: string,
  userId: string,
  submissionId: string,
  critiquerId: string,
): Promise<{ success: boolean; error?: string }> {
  "use step";

  console.log(
    "[Workflow] sendNotificationEmail called with recipientEmail:",
    recipientEmail,
    "userLanguage:",
    userLanguage,
  );

  const { sendEmail } = await import("@/lib/email");
  const { CritiqueNotificationEmail } = await import(
    "@/emails/templates/critique-notification-email"
  );
  const { getEmailTranslations } = await import("@/lib/email/translations");
  const { prisma } = await import("@/lib/prisma");

  try {
    // Load translations for the user's language
    const t = await getEmailTranslations(userLanguage, "email");

    console.log(
      "[Workflow] Creating email component for",
      critiquerName,
      "submission:",
      submissionTitle,
    );

    const titleDisplay = submissionTitle
      ? `"${submissionTitle}"`
      : t("critiqueNotification.yourWork");

    const emailComponent = CritiqueNotificationEmail({
      critiquerName,
      submissionTitle,
      submissionUrl,
      critiquerProfileUrl,
      baseUrl,
      userId,
      t,
    });

    // Translate email subject
    const emailSubject = t("critiqueNotification.subject", {
      critiquerName: critiquerName || t("critiqueNotification.someone"),
      titleDisplay,
    });

    console.log("[Workflow] Sending email to", recipientEmail);

    await sendEmail({
      to: recipientEmail,
      subject: emailSubject,
      react: emailComponent,
    });

    // Log the notification
    try {
      await prisma.notificationLog.create({
        data: {
          type: "CRITIQUE_ADDED",
          meta: { submissionId, critiquerId },
          userId,
        },
      });
      console.log(
        "[Workflow] Notification log created for critique:",
        submissionId,
        "user:",
        userId,
      );
    } catch (logError) {
      // Log error but don't fail the whole operation if notification log fails
      console.error("[Workflow] Failed to create notification log:", logError);
    }

    console.log("[Workflow] Email sent successfully to", recipientEmail);
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Workflow] Error sending email:", errorMessage, error);
    return { success: false, error: errorMessage };
  }
}

export async function sendCritiqueNotification(
  input: SendCritiqueNotificationInput,
): Promise<{ success: boolean; error?: string }> {
  console.log("[Workflow] sendCritiqueNotification started with input:", input);

  const { critiquerId, submissionId } = input;

  const { submission, critiquer } = await fetchSubmissionAndCritiquer(
    submissionId,
    critiquerId,
  );

  if (!submission) {
    console.log("[Workflow] Submission not found for ID:", submissionId);
    return { success: false, error: "Submission not found" };
  }

  if (!critiquer) {
    console.log("[Workflow] Critiquer not found for ID:", critiquerId);
    return { success: false, error: "Critiquer not found" };
  }

  // Check if the submission owner wants email notifications (using emailOnFavorite for now)
  if (!submission.user.emailOnFavorite) {
    console.log(
      "[Workflow] Submission owner has disabled email notifications. submissionUserId:",
      submission.userId,
    );
    return { success: true };
  }

  // Don't send email if the critiquer is the owner
  if (critiquerId === submission.userId) {
    console.log("[Workflow] Critiquer is the submission owner, skipping email");
    return { success: true };
  }

  // Build URLs
  const { buildRoutePath } = await import("@/lib/routes");
  const baseUrl = process.env.NEXTAUTH_URL || "https://prompts.art";
  const submissionUrl = `${baseUrl}/creators/${submission.userId}/s/${submissionId}`;
  const critiquerProfileUrl = `${baseUrl}${buildRoutePath("profile", { creatorid: critiquer.id })}`;

  console.log("[Workflow] Proceeding to send email. URLs:", {
    submissionUrl,
    critiquerProfileUrl,
  });

  return sendNotificationEmail(
    critiquer.name,
    submission.title,
    submissionUrl,
    critiquerProfileUrl,
    submission.user.email,
    submission.user.language,
    baseUrl,
    submission.userId,
    submissionId,
    critiquerId,
  );
}
