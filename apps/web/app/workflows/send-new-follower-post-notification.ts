"use workflow";

export interface SendNewFollowerPostNotificationInput {
  submissionId: string;
  creatorId: string;
}

interface SubmissionData {
  id: string;
  title: string | null;
  userId: string;
  user: {
    id: string;
    name: string | null;
    slug: string | null;
    language: string;
  };
}

interface FollowerData {
  id: string;
  email: string;
  name: string | null;
  language: string;
  emailOnNewFollowerPost: boolean;
}

async function fetchSubmissionAndFollowers(
  submissionId: string,
  creatorId: string,
): Promise<{
  submission: SubmissionData | null;
  followers: FollowerData[];
}> {
  "use step";

  const { prisma } = await import("@/lib/prisma");

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      user: {
        select: { id: true, name: true, slug: true, language: true },
      },
    },
  });

  if (!submission || submission.userId !== creatorId) {
    return { submission: null, followers: [] };
  }

  const blocks = await prisma.block.findMany({
    where: { blockerId: creatorId },
    select: { blockedId: true },
  });
  const blockedIds = blocks.map((b) => b.blockedId);

  const follows = await prisma.follow.findMany({
    where: {
      followingId: creatorId,
      ...(blockedIds.length > 0 ? { followerId: { notIn: blockedIds } } : {}),
    },
    include: {
      follower: {
        select: {
          id: true,
          email: true,
          name: true,
          language: true,
          emailOnNewFollowerPost: true,
        },
      },
    },
  });

  const followers = follows
    .map((f) => f.follower)
    .filter((u) => u.emailOnNewFollowerPost);

  return {
    submission: {
      id: submission.id,
      title: submission.title,
      userId: submission.userId,
      user: submission.user,
    },
    followers,
  };
}

async function sendOneNotification(
  creatorName: string | null,
  submissionTitle: string | null,
  submissionUrl: string,
  creatorProfileUrl: string,
  recipientEmail: string,
  recipientLanguage: string,
  baseUrl: string,
  recipientUserId: string,
  submissionId: string,
  creatorId: string,
): Promise<{ success: boolean; error?: string }> {
  "use step";

  const { sendEmail } = await import("@/lib/email");
  const { NewFollowerPostEmail } = await import(
    "@/emails/templates/new-follower-post-email"
  );
  const { getEmailTranslations } = await import("@/lib/email/translations");
  const { prisma } = await import("@/lib/prisma");

  try {
    const t = await getEmailTranslations(recipientLanguage, "email");
    const emailComponent = NewFollowerPostEmail({
      creatorName,
      submissionTitle,
      submissionUrl,
      creatorProfileUrl,
      baseUrl,
      userId: recipientUserId,
      t,
    });

    const titleDisplay = submissionTitle
      ? `"${submissionTitle}"`
      : t("newFollowerPost.newWork");
    const emailSubject = t("newFollowerPost.subject", {
      creatorName: creatorName || "A creator",
      titleDisplay,
    });

    await sendEmail({
      to: recipientEmail,
      subject: emailSubject,
      react: emailComponent,
    });

    await prisma.notificationLog.create({
      data: {
        type: "NEW_FOLLOWER_POST",
        meta: { submissionId, creatorId, recipientUserId },
        userId: recipientUserId,
      },
    });

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Workflow] Error sending new follower post email:", error);
    return { success: false, error: errorMessage };
  }
}

export async function sendNewFollowerPostNotification(
  input: SendNewFollowerPostNotificationInput,
): Promise<{ sent: number; failed: number }> {
  const { submissionId, creatorId } = input;

  const { submission, followers } = await fetchSubmissionAndFollowers(
    submissionId,
    creatorId,
  );

  if (!submission || followers.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const { getCreatorUrl } = await import("@/lib/utils");
  const baseUrl = process.env.NEXTAUTH_URL || "https://prompts.art";
  const submissionUrl = `${baseUrl}/creators/${submission.userId}/s/${submissionId}`;
  const creatorProfileUrl = `${baseUrl}${getCreatorUrl(submission.user)}`;

  let sent = 0;
  let failed = 0;

  for (const follower of followers) {
    const result = await sendOneNotification(
      submission.user.name,
      submission.title,
      submissionUrl,
      creatorProfileUrl,
      follower.email,
      follower.language,
      baseUrl,
      follower.id,
      submissionId,
      creatorId,
    );
    if (result.success) sent++;
    else failed++;
  }

  return { sent, failed };
}
