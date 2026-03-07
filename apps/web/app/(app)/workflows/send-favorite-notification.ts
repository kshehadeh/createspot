"use workflow";

export interface SendFavoriteNotificationInput {
  favorerId: string;
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

interface FavorerData {
  id: string;
  slug: string | null;
  name: string | null;
}

async function fetchSubmissionAndFavorer(
  submissionId: string,
  favorerId: string,
): Promise<{
  submission: SubmissionData | null;
  favorer: FavorerData | null;
}> {
  "use step";

  console.log(
    "[Workflow] fetchSubmissionAndFavorer called with submissionId:",
    submissionId,
    "favorerId:",
    favorerId,
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

  const favorer = await prisma.user.findUnique({
    where: { id: favorerId },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  console.log(
    "[Workflow] Favorer found:",
    favorer ? { id: favorer.id, slug: favorer.slug, name: favorer.name } : null,
  );

  return { submission, favorer };
}

async function sendNotificationEmail(
  favorerName: string | null,
  submissionTitle: string | null,
  submissionUrl: string,
  favorerProfileUrl: string,
  recipientEmail: string,
  userLanguage: string,
  baseUrl: string,
  userId: string,
  submissionId: string,
  favorerId: string,
): Promise<{ success: boolean; error?: string }> {
  "use step";

  console.log(
    "[Workflow] sendNotificationEmail called with recipientEmail:",
    recipientEmail,
    "userLanguage:",
    userLanguage,
  );

  const { sendEmail, listUnsubscribeHeaders } = await import("@/lib/email");
  const { FavoriteNotificationEmail } = await import(
    "@/emails/templates/favorite-notification-email"
  );
  const { getEmailTranslations } = await import("@/lib/email/translations");
  const { prisma } = await import("@/lib/prisma");
  const { buildRoutePath } = await import("@/lib/routes");

  try {
    // Load translations for the user's language
    const t = await getEmailTranslations(userLanguage, "email");

    console.log(
      "[Workflow] Creating email component for",
      favorerName,
      "submission:",
      submissionTitle,
    );

    const titleDisplay = submissionTitle
      ? `"${submissionTitle}"`
      : t("favoriteNotification.yourWork");

    const emailComponent = FavoriteNotificationEmail({
      favorerName,
      submissionTitle,
      submissionUrl,
      favorerProfileUrl,
      baseUrl,
      userId,
      t,
    });

    // Translate email subject
    const emailSubject = t("favoriteNotification.subject", {
      favorerName: favorerName || t("favoriteNotification.someone"),
      titleDisplay,
    });

    const preferencesUrl = `${baseUrl}${buildRoutePath("profileEdit", {
      creatorid: userId,
    })}`;

    console.log("[Workflow] Sending email to", recipientEmail);

    await sendEmail({
      to: recipientEmail,
      subject: emailSubject,
      idempotencyKey: `favorite/${userId}-${submissionId}-${favorerId}`,
      headers: listUnsubscribeHeaders(preferencesUrl),
      react: emailComponent,
    });

    // Log the notification
    try {
      await prisma.notificationLog.create({
        data: {
          type: "FAVORITE_ADDED",
          meta: { submissionId, favorerId },
          userId,
        },
      });
      console.log(
        "[Workflow] Notification log created for favorite:",
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

export async function sendFavoriteNotification(
  input: SendFavoriteNotificationInput,
): Promise<{ success: boolean; error?: string }> {
  console.log("[Workflow] sendFavoriteNotification started with input:", input);

  const { favorerId, submissionId } = input;

  const { submission, favorer } = await fetchSubmissionAndFavorer(
    submissionId,
    favorerId,
  );

  if (!submission) {
    console.log("[Workflow] Submission not found for ID:", submissionId);
    return { success: false, error: "Submission not found" };
  }

  if (!favorer) {
    console.log("[Workflow] Favorer not found for ID:", favorerId);
    return { success: false, error: "Favorer not found" };
  }

  // Check if the submission owner wants email notifications on favorites
  if (!submission.user.emailOnFavorite) {
    console.log(
      "[Workflow] Submission owner has disabled email notifications. submissionUserId:",
      submission.userId,
    );
    return { success: true };
  }

  // Don't send email if the favorer is the owner
  if (favorerId === submission.userId) {
    console.log("[Workflow] Favorer is the submission owner, skipping email");
    return { success: true };
  }

  // Build URLs
  const { getCreatorUrl } = await import("@/lib/utils");
  const baseUrl = process.env.NEXTAUTH_URL || "https://prompts.art";
  const submissionUrl = `${baseUrl}/creators/${submission.userId}/s/${submissionId}`;
  const favorerProfileUrl = `${baseUrl}${getCreatorUrl(favorer)}`;

  console.log("[Workflow] Proceeding to send email. URLs:", {
    submissionUrl,
    favorerProfileUrl,
  });

  return sendNotificationEmail(
    favorer.name,
    submission.title,
    submissionUrl,
    favorerProfileUrl,
    submission.user.email,
    submission.user.language,
    baseUrl,
    submission.userId,
    submissionId,
    favorerId,
  );
}
