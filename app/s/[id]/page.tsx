import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionDetail } from "./submission-detail";

export const dynamic = "force-dynamic";

interface SubmissionPageProps {
  params: Promise<{ id: string }>;
}

async function getSubmission(id: string) {
  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      text: true,
      wordIndex: true,
      category: true,
      tags: true,
      shareStatus: true,
      userId: true,
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          instagram: true,
          twitter: true,
          linkedin: true,
          website: true,
        },
      },
      prompt: {
        select: {
          id: true,
          word1: true,
          word2: true,
          word3: true,
          weekStart: true,
          weekEnd: true,
        },
      },
      _count: {
        select: {
          favorites: true,
        },
      },
    },
  });

  return submission;
}

export async function generateMetadata({
  params,
}: SubmissionPageProps): Promise<Metadata> {
  const { id } = await params;
  const submission = await getSubmission(id);

  if (!submission) {
    return {
      title: "Submission Not Found",
    };
  }

  const word =
    submission.prompt && submission.wordIndex
      ? [
          submission.prompt.word1,
          submission.prompt.word2,
          submission.prompt.word3,
        ][submission.wordIndex - 1]
      : null;
  const title =
    submission.title || (word ? `Submission for "${word}"` : "Portfolio Piece");
  const description = submission.text
    ? submission.text.replace(/<[^>]*>/g, "").slice(0, 160)
    : submission.prompt
      ? `View this submission for the prompt: ${submission.prompt.word1}, ${submission.prompt.word2}, ${submission.prompt.word3}`
      : "View this portfolio piece";

  // Generate absolute OG image URL - Next.js will automatically use opengraph-image.tsx
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const ogImageUrl = `${baseUrl}/s/${id}/opengraph-image`;

  return {
    title: `${title} | Prompts`,
    description,
    openGraph: {
      title,
      description,
      images: [ogImageUrl],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function SubmissionPage({ params }: SubmissionPageProps) {
  const { id } = await params;
  const session = await auth();

  const submission = await getSubmission(id);

  if (!submission) {
    notFound();
  }

  // Check share status visibility
  // PRIVATE submissions are only visible to the owner
  if (submission.shareStatus === "PRIVATE") {
    if (!session?.user || session.user.id !== submission.userId) {
      notFound();
    }
  }
  // PROFILE and PUBLIC are visible to everyone

  return <SubmissionDetail submission={submission} isLoggedIn={!!session?.user} />;
}
