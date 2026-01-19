import { PrismaClient } from "@/app/generated/prisma/client";

export interface BadgeDefinition {
  key: BadgeKey;
  name: string;
  description: string;
  image: string; // relative to public, e.g., /badges/<key>.png
  isEligible: (userId: string, prisma: PrismaClient) => Promise<boolean>;
}

export type BadgeKey =
  | "first_portfolio_submission"
  | "first_prompt_submission"
  | "first_critique_received"
  | "first_critique_given";

const hasPortfolioSubmission = async (
  userId: string,
  prisma: PrismaClient,
): Promise<boolean> => {
  const count = await prisma.submission.count({
    where: { userId, isPortfolio: true },
    take: 1,
  });
  return count > 0;
};

const hasPromptSubmission = async (
  userId: string,
  prisma: PrismaClient,
): Promise<boolean> => {
  const count = await prisma.submission.count({
    where: { userId, promptId: { not: null } },
    take: 1,
  });
  return count > 0;
};

const hasCritiqueReceived = async (
  userId: string,
  prisma: PrismaClient,
): Promise<boolean> => {
  const count = await prisma.critique.count({
    where: { submission: { userId } },
    take: 1,
  });
  return count > 0;
};

const hasCritiqueGiven = async (
  userId: string,
  prisma: PrismaClient,
): Promise<boolean> => {
  const count = await prisma.critique.count({
    where: { critiquerId: userId },
    take: 1,
  });
  return count > 0;
};

export const badgeDefinitions: BadgeDefinition[] = [
  {
    key: "first_portfolio_submission",
    name: "Aspiring Creator",
    description: "First Portfolio Submission",
    image: "/badges/first_portfolio_submission.png",
    isEligible: hasPortfolioSubmission,
  },
  {
    key: "first_prompt_submission",
    name: "Prompt Pioneer",
    description: "First Prompt Submission",
    image: "/badges/first_prompt_submission.png",
    isEligible: hasPromptSubmission,
  },
  {
    key: "first_critique_received",
    name: "Featured Voice",
    description: "First Critique Received",
    image: "/badges/first_critique_received.png",
    isEligible: hasCritiqueReceived,
  },
  {
    key: "first_critique_given",
    name: "Artful Eye",
    description: "First Critique Given",
    image: "/badges/first_critique_given.png",
    isEligible: hasCritiqueGiven,
  },
];

export const badgeDefinitionsByKey = badgeDefinitions.reduce<
  Record<BadgeKey, BadgeDefinition>
>(
  (acc, badge) => {
    acc[badge.key] = badge;
    return acc;
  },
  {} as Record<BadgeKey, BadgeDefinition>,
);
