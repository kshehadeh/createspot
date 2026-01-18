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
      imageFocalPoint: true,
      text: true,
      wordIndex: true,
      category: true,
      tags: true,
      shareStatus: true,
      critiquesEnabled: true,
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

  const title = submission.title || "Untitled";
  const creatorName = submission.user.name || "Anonymous";
  const description = submission.text
    ? submission.text.replace(/<[^>]*>/g, "").trim()
    : submission.prompt
      ? `View this submission for the prompt: ${submission.prompt.word1}, ${submission.prompt.word2}, ${submission.prompt.word3}`
      : "View this portfolio piece";

  // Build keywords array from tags and category
  const keywords: string[] = [];

  // Add tags
  if (submission.tags && submission.tags.length > 0) {
    keywords.push(...submission.tags);
  }

  // Add category
  if (submission.category) {
    keywords.push(submission.category);
  }

  // Generate absolute OG image URL - Next.js will automatically use opengraph-image.tsx
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const ogImageUrl = `${baseUrl}/s/${id}/opengraph-image`;

  const pageTitle = `${title} | ${creatorName} | Create Spot`;

  return {
    title: pageTitle,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    openGraph: {
      title: pageTitle,
      description,
      images: [ogImageUrl],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
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

  const isOwner = !!session?.user && session.user.id === submission.userId;

  return (
    <SubmissionDetail
      submission={{
        ...submission,
        imageFocalPoint: submission.imageFocalPoint as
          | { x: number; y: number }
          | null
          | undefined,
      }}
      isLoggedIn={!!session?.user}
      isOwner={isOwner}
      currentUserId={session?.user?.id}
    />
  );
}
