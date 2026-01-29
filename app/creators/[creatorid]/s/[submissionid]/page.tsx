import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTutorialData } from "@/lib/get-tutorial-data";
import { getSubmissionMetadata } from "@/lib/og-metadata";
import { SubmissionDetail } from "@/components/submission-detail";

export const dynamic = "force-dynamic";

interface SubmissionPageProps {
  params: Promise<{ creatorid: string; submissionid: string }>;
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
          slug: true,
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
  const { submissionid } = await params;
  const submission = await getSubmission(submissionid);

  if (!submission) {
    return { title: "Submission Not Found" };
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return getSubmissionMetadata(
    {
      id: submission.id,
      title: submission.title,
      text: submission.text,
      tags: submission.tags,
      category: submission.category,
      user: submission.user,
      prompt: submission.prompt,
    },
    baseUrl,
  );
}

export default async function SubmissionPage({ params }: SubmissionPageProps) {
  const { creatorid, submissionid } = await params;
  const session = await auth();

  const submission = await getSubmission(submissionid);

  if (!submission) {
    notFound();
  }

  // Verify the submission belongs to the creator in the URL
  // Check both slug and ID
  const creator = await prisma.user.findFirst({
    where: {
      OR: [{ slug: creatorid }, { id: creatorid }],
    },
    select: { id: true },
  });

  if (!creator || submission.userId !== creator.id) {
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

  // Fetch tutorial data for hints
  const tutorialData = await getTutorialData(session?.user?.id);

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
      tutorialData={tutorialData}
    />
  );
}
