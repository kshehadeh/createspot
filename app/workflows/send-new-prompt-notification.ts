"use workflow";

export interface SendNewPromptNotificationInput {
  promptId: string;
}

interface PromptData {
  id: string;
  word1: string;
  word2: string;
  word3: string;
  weekStart: Date;
  weekEnd: Date;
}

interface UserData {
  id: string;
  email: string;
  name: string | null;
  language: string;
}

async function fetchPrompt(promptId: string): Promise<PromptData | null> {
  "use step";

  console.log("[Workflow] fetchPrompt called with promptId:", promptId);

  const { prisma } = await import("@/lib/prisma");

  const prompt = await prisma.prompt.findUnique({
    where: { id: promptId },
  });

  console.log(
    "[Workflow] Prompt found:",
    prompt
      ? {
          id: prompt.id,
          word1: prompt.word1,
          word2: prompt.word2,
          word3: prompt.word3,
        }
      : null,
  );

  return prompt;
}

async function fetchSubscribedUsers(): Promise<UserData[]> {
  "use step";

  console.log("[Workflow] fetchSubscribedUsers called");

  const { prisma } = await import("@/lib/prisma");

  const users = await prisma.user.findMany({
    where: {
      emailFeatureUpdates: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      language: true,
    },
  });

  console.log("[Workflow] Found", users.length, "subscribed users");

  return users;
}

async function checkNotificationSent(
  promptId: string,
  userId: string,
): Promise<boolean> {
  "use step";

  const { prisma } = await import("@/lib/prisma");

  const existing = await prisma.notificationLog.findFirst({
    where: {
      type: "NEW_PROMPT",
      userId,
      meta: {
        path: ["promptId"],
        equals: promptId,
      },
    },
  });

  return !!existing;
}

async function sendEmailAndLog(
  user: UserData,
  prompt: PromptData,
  baseUrl: string,
): Promise<{ success: boolean; error?: string }> {
  "use step";

  console.log(
    "[Workflow] sendEmailAndLog called for user:",
    user.email,
    "prompt:",
    prompt.id,
  );

  const { sendEmail } = await import("@/lib/email");
  const { NewPromptNotificationEmail } = await import(
    "@/emails/templates/new-prompt-notification-email"
  );
  const { getEmailTranslations } = await import("@/lib/email/translations");
  const { prisma } = await import("@/lib/prisma");

  try {
    const t = await getEmailTranslations(user.language, "email");

    const promptUrl = `${baseUrl}/prompt`;
    const playUrl = `${baseUrl}/play`;

    const emailComponent = NewPromptNotificationEmail({
      userName: user.name,
      word1: prompt.word1,
      word2: prompt.word2,
      word3: prompt.word3,
      promptUrl,
      playUrl,
      baseUrl,
      userId: user.id,
      t,
    });

    const emailSubject = t("newPromptNotification.subject", {
      word1: prompt.word1,
      word2: prompt.word2,
      word3: prompt.word3,
    });

    await sendEmail({
      to: user.email,
      subject: emailSubject,
      react: emailComponent,
    });

    // Log the notification
    await prisma.notificationLog.create({
      data: {
        type: "NEW_PROMPT",
        meta: { promptId: prompt.id },
        userId: user.id,
      },
    });

    console.log("[Workflow] Email sent and logged for user:", user.email);
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      "[Workflow] Error sending email to",
      user.email,
      ":",
      errorMessage,
    );
    return { success: false, error: errorMessage };
  }
}

export async function sendNewPromptNotification(
  input: SendNewPromptNotificationInput,
): Promise<{ success: boolean; sentCount: number; errors: string[] }> {
  console.log(
    "[Workflow] sendNewPromptNotification started with input:",
    input,
  );

  const { promptId } = input;

  const prompt = await fetchPrompt(promptId);

  if (!prompt) {
    console.log("[Workflow] Prompt not found for ID:", promptId);
    return { success: false, sentCount: 0, errors: ["Prompt not found"] };
  }

  const users = await fetchSubscribedUsers();

  if (users.length === 0) {
    console.log("[Workflow] No subscribed users found");
    return { success: true, sentCount: 0, errors: [] };
  }

  const baseUrl = process.env.NEXTAUTH_URL || "https://prompts.art";
  let sentCount = 0;
  const errors: string[] = [];

  for (const user of users) {
    // Check if already sent to this user
    const alreadySent = await checkNotificationSent(promptId, user.id);
    if (alreadySent) {
      console.log("[Workflow] Already sent to user:", user.id);
      continue;
    }

    const result = await sendEmailAndLog(user, prompt, baseUrl);
    if (result.success) {
      sentCount++;
    } else if (result.error) {
      errors.push(`${user.email}: ${result.error}`);
    }
  }

  console.log(
    "[Workflow] sendNewPromptNotification completed. Sent:",
    sentCount,
    "Errors:",
    errors.length,
  );

  return { success: true, sentCount, errors };
}
