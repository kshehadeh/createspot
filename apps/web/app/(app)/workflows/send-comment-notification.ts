"use workflow";

export interface SendCommentNotificationInput {
  commenterId: string;
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

interface CommenterData {
  id: string;
  slug: string | null;
  name: string | null;
}

async function fetchSubmissionAndCommenter(
  submissionId: string,
  commenterId: string,
): Promise<{
  submission: SubmissionData | null;
  commenter: CommenterData | null;
}> {
  "use step";

  console.log(
    "[Workflow] fetchSubmissionAndCommenter called with submissionId:",
    submissionId,
    "commenterId:",
    commenterId,
  );

  const { prisma } = await import("@/lib/prisma");

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { user: true },
  });

  const commenter = await prisma.user.findUnique({
    where: { id: commenterId },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  return { submission, commenter };
}

async function sendNotificationEmail(
  commenterName: string | null,
  submissionTitle: string | null,
  submissionUrl: string,
  commenterProfileUrl: string,
  recipientEmail: string,
  userLanguage: string,
  baseUrl: string,
  userId: string,
  submissionId: string,
  commenterId: string,
): Promise<{ success: boolean; error?: string }> {
  "use step";

  console.log(
    "[Workflow] sendNotificationEmail called with recipientEmail:",
    recipientEmail,
  );

  const { sendEmail, listUnsubscribeHeaders } = await import("@/lib/email");
  const { CommentNotificationEmail } = await import(
    "@/emails/templates/comment-notification-email"
  );
  const { getEmailTranslations } = await import("@/lib/email/translations");
  const { prisma } = await import("@/lib/prisma");
  const { buildRoutePath } = await import("@/lib/routes");

  try {
    const t = await getEmailTranslations(userLanguage, "email");

    const titleDisplay = submissionTitle
      ? `"${submissionTitle}"`
      : t("commentNotification.yourWork");

    const emailComponent = CommentNotificationEmail({
      commenterName,
      submissionTitle,
      submissionUrl,
      commenterProfileUrl,
      baseUrl,
      userId,
      t,
    });

    const emailSubject = t("commentNotification.subject", {
      commenterName: commenterName || t("commentNotification.someone"),
      titleDisplay,
    });

    const preferencesUrl = `${baseUrl}${buildRoutePath("profileEdit", {
      creatorid: userId,
    })}`;

    await sendEmail({
      to: recipientEmail,
      subject: emailSubject,
      idempotencyKey: `comment/${userId}-${submissionId}-${commenterId}`,
      headers: listUnsubscribeHeaders(preferencesUrl),
      react: emailComponent,
    });

    try {
      await prisma.notificationLog.create({
        data: {
          type: "COMMENT_ADDED",
          meta: { submissionId, commenterId },
          userId,
        },
      });
    } catch (logError) {
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

export async function sendCommentNotification(
  input: SendCommentNotificationInput,
): Promise<{ success: boolean; error?: string }> {
  console.log("[Workflow] sendCommentNotification started with input:", input);

  const { commenterId, submissionId } = input;

  const { submission, commenter } = await fetchSubmissionAndCommenter(
    submissionId,
    commenterId,
  );

  if (!submission) {
    return { success: false, error: "Submission not found" };
  }

  if (!commenter) {
    return { success: false, error: "Commenter not found" };
  }

  // Don't send email if the commenter is the owner
  if (commenterId === submission.userId) {
    return { success: true };
  }

  // Use emailOnFavorite preference for now (TODO: add dedicated emailOnComment)
  if (!submission.user.emailOnFavorite) {
    return { success: true };
  }

  const { getCreatorUrl } = await import("@/lib/utils");
  const baseUrl = process.env.NEXTAUTH_URL || "https://prompts.art";
  const submissionUrl = `${baseUrl}/creators/${submission.userId}/s/${submissionId}`;
  const commenterProfileUrl = `${baseUrl}${getCreatorUrl(commenter)}`;

  return sendNotificationEmail(
    commenter.name,
    submission.title,
    submissionUrl,
    commenterProfileUrl,
    submission.user.email,
    submission.user.language,
    baseUrl,
    submission.userId,
    submissionId,
    commenterId,
  );
}
