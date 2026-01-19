import { prisma } from "@/lib/prisma";
import { badgeDefinitionsByKey } from "@/lib/badges";

interface NotificationMeta {
  [key: string]: unknown;
}

export async function formatNotificationMetadata(
  type: string,
  meta: NotificationMeta,
): Promise<string> {
  switch (type) {
    case "BADGE_AWARDED": {
      const badgeKey = meta.badgeKey as string;
      if (!badgeKey) return "Unknown badge";
      const badge =
        badgeDefinitionsByKey[badgeKey as keyof typeof badgeDefinitionsByKey];
      return badge ? badge.name : `Badge: ${badgeKey}`;
    }

    case "NEW_PROMPT": {
      const promptId = meta.promptId as string;
      if (!promptId) return "Unknown prompt";
      try {
        const prompt = await prisma.prompt.findUnique({
          where: { id: promptId },
          select: { word1: true, word2: true, word3: true },
        });
        if (prompt) {
          return `${prompt.word1}, ${prompt.word2}, ${prompt.word3}`;
        }
        return `Prompt: ${promptId}`;
      } catch {
        return `Prompt: ${promptId}`;
      }
    }

    case "FAVORITE_ADDED": {
      const submissionId = meta.submissionId as string;
      const favorerId = meta.favorerId as string;
      if (!submissionId) return "Unknown submission";

      let description = `Submission ${submissionId.substring(0, 8)}...`;

      if (favorerId) {
        try {
          const favorer = await prisma.user.findUnique({
            where: { id: favorerId },
            select: { name: true, email: true },
          });
          if (favorer) {
            const favorerName =
              favorer.name || favorer.email || favorerId.substring(0, 8);
            description = `Favorited by ${favorerName}`;
          }
        } catch {
          // Ignore errors, use default description
        }
      }

      return description;
    }

    case "CRITIQUE_ADDED": {
      const submissionId = meta.submissionId as string;
      const critiquerId = meta.critiquerId as string;
      if (!submissionId) return "Unknown submission";

      let description = `Submission ${submissionId.substring(0, 8)}...`;

      if (critiquerId) {
        try {
          const critiquer = await prisma.user.findUnique({
            where: { id: critiquerId },
            select: { name: true, email: true },
          });
          if (critiquer) {
            const critiquerName =
              critiquer.name || critiquer.email || critiquerId.substring(0, 8);
            description = `Critique by ${critiquerName}`;
          }
        } catch {
          // Ignore errors, use default description
        }
      }

      return description;
    }

    default:
      return JSON.stringify(meta);
  }
}
