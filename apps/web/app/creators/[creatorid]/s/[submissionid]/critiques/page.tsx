import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCreatorUrl } from "@/lib/utils";
import { getTutorialData } from "@/lib/get-tutorial-data";
import { CritiquesPageContent } from "./critiques-page-content";

export const dynamic = "force-dynamic";

interface CritiquesPageProps {
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
      shareStatus: true,
      critiquesEnabled: true,
      userId: true,
      user: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      tags: true,
    },
  });
  return submission;
}

export async function generateMetadata({
  params,
}: CritiquesPageProps): Promise<Metadata> {
  const { submissionid } = await params;
  const [session, submission] = await Promise.all([
    auth(),
    getSubmission(submissionid),
  ]);
  if (!submission) {
    return { title: "Submission Not Found" };
  }
  const creatorName = submission.user.name || "Creator";
  const title = submission.title || "Untitled";
  const isOwner = session?.user?.id === submission.userId;
  return {
    title: isOwner
      ? `All Critiques for ${title} | ${creatorName} | Create Spot`
      : `Your Critiques for ${title} | ${creatorName} | Create Spot`,
    description: `View and manage critiques for "${title}" by ${creatorName}.`,
  };
}

export default async function CritiquesPage({ params }: CritiquesPageProps) {
  const { creatorid, submissionid } = await params;
  const [session, submission] = await Promise.all([
    auth(),
    getSubmission(submissionid),
  ]);

  if (!session?.user) {
    redirect("/welcome");
  }

  if (!submission) {
    notFound();
  }

  const [creator, tutorialData] = await Promise.all([
    prisma.user.findFirst({
      where: {
        OR: [{ slug: creatorid }, { id: creatorid }],
      },
      select: { id: true },
    }),
    getTutorialData(session?.user?.id),
  ]);

  if (!creator || submission.userId !== creator.id) {
    notFound();
  }

  const isOwner = session.user.id === submission.userId;

  if (!isOwner) {
    if (submission.shareStatus !== "PUBLIC" || !submission.critiquesEnabled) {
      notFound();
    }
  }

  const submissionForClient = {
    ...submission,
    imageFocalPoint: submission.imageFocalPoint as
      | { x: number; y: number }
      | null
      | undefined,
  };

  const submissionPageHref = `${getCreatorUrl(submission.user)}/s/${submission.id}`;

  return (
    <CritiquesPageContent
      submission={submissionForClient}
      creatorid={creatorid}
      isOwner={isOwner}
      currentUserId={session.user.id}
      submissionPageHref={submissionPageHref}
      tutorialData={tutorialData}
    />
  );
}
