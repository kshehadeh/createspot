import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { SubmissionDetail } from "./submission-detail";

export const dynamic = "force-dynamic";

interface SubmissionPageProps {
  params: Promise<{ id: string }>;
}

async function getSubmission(id: string) {
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
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

  const word = [submission.prompt.word1, submission.prompt.word2, submission.prompt.word3][submission.wordIndex - 1];
  const title = submission.title || `Submission for "${word}"`;
  const description = submission.text
    ? submission.text.replace(/<[^>]*>/g, "").slice(0, 160)
    : `View this submission for the prompt: ${submission.prompt.word1}, ${submission.prompt.word2}, ${submission.prompt.word3}`;

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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header title="Submission" user={session?.user} />
      <SubmissionDetail submission={submission} isLoggedIn={!!session?.user} />
    </div>
  );
}

