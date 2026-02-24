"use workflow";

export interface SendNewFollowerNotificationInput {
  followerId: string;
  followingId: string;
}

interface FollowingUserData {
  id: string;
  email: string;
  name: string | null;
  language: string;
  emailOnNewFollower: boolean;
}

interface FollowerUserData {
  id: string;
  name: string | null;
  slug: string | null;
}

async function fetchUsers(
  followerId: string,
  followingId: string,
): Promise<{
  following: FollowingUserData | null;
  follower: FollowerUserData | null;
}> {
  "use step";

  const { prisma } = await import("@/lib/prisma");

  const [following, follower] = await Promise.all([
    prisma.user.findUnique({
      where: { id: followingId },
      select: {
        id: true,
        email: true,
        name: true,
        language: true,
        emailOnNewFollower: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: followerId },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return {
    following: following as FollowingUserData | null,
    follower: follower as FollowerUserData | null,
  };
}

async function sendNotificationEmail(
  followerName: string | null,
  followerProfileUrl: string,
  recipientEmail: string,
  recipientLanguage: string,
  baseUrl: string,
  recipientUserId: string,
  followerId: string,
  followingId: string,
): Promise<{ success: boolean; error?: string }> {
  "use step";

  const { sendEmail, listUnsubscribeHeaders } = await import("@/lib/email");
  const { NewFollowerEmail } = await import(
    "@/emails/templates/new-follower-email"
  );
  const { getEmailTranslations } = await import("@/lib/email/translations");
  const { prisma } = await import("@/lib/prisma");
  const { buildRoutePath } = await import("@/lib/routes");

  try {
    const t = await getEmailTranslations(recipientLanguage, "email");
    const emailComponent = NewFollowerEmail({
      followerName,
      followerProfileUrl,
      baseUrl,
      userId: recipientUserId,
      t,
    });

    const emailSubject = t("newFollower.subject", {
      followerName: followerName || t("newFollower.someone"),
    });

    const preferencesUrl = `${baseUrl}${buildRoutePath("profileEdit", {
      creatorid: recipientUserId,
    })}`;

    await sendEmail({
      to: recipientEmail,
      subject: emailSubject,
      idempotencyKey: `new-follower/${followingId}-${followerId}`,
      headers: listUnsubscribeHeaders(preferencesUrl),
      react: emailComponent,
    });

    await prisma.notificationLog.create({
      data: {
        type: "NEW_FOLLOWER",
        meta: { followerId, followingId },
        userId: recipientUserId,
      },
    });

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Workflow] Error sending new follower email:", error);
    return { success: false, error: errorMessage };
  }
}

export async function sendNewFollowerNotification(
  input: SendNewFollowerNotificationInput,
): Promise<{ success: boolean; error?: string }> {
  const { followerId, followingId } = input;

  const { following, follower } = await fetchUsers(followerId, followingId);

  if (!following || !follower) {
    return { success: false, error: "User not found" };
  }

  if (!following.emailOnNewFollower) {
    return { success: true };
  }

  const { getCreatorUrl } = await import("@/lib/utils");
  const baseUrl = process.env.NEXTAUTH_URL || "https://prompts.art";
  const followerProfileUrl = `${baseUrl}${getCreatorUrl(follower)}`;

  return sendNotificationEmail(
    follower.name,
    followerProfileUrl,
    following.email,
    following.language,
    baseUrl,
    followingId,
    followerId,
    followingId,
  );
}
