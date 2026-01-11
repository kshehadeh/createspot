import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { ProfileHeader } from "./profile-header";
import { ProfileEditForm } from "./profile-edit-form";

export const dynamic = "force-dynamic";

export default async function ProfileEditPage() {
  const session = await auth();
  const t = await getTranslations("profile");

  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      instagram: true,
      twitter: true,
      linkedin: true,
      website: true,
      city: true,
      stateProvince: true,
      country: true,
      language: true,
      featuredSubmissionId: true,
      profileImageUrl: true,
      profileImageFocalPoint: true,
    },
  });

  // Fetch all user submissions for the featured piece selector (up to 100)
  const submissions = await prisma.submission.findMany({
    where: { userId: session.user.id },
    include: {
      prompt: {
        select: {
          word1: true,
          word2: true,
          word3: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Count portfolio items for display
  const portfolioItemCount = await prisma.submission.count({
    where: {
      userId: session.user.id,
      isPortfolio: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  return (
    <PageLayout maxWidth="max-w-5xl" className="w-full">
      <div className="mb-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
          <ProfileHeader
            profileImageUrl={user.profileImageUrl}
            oauthImage={user.image}
            profileImageFocalPoint={
              user.profileImageFocalPoint as {
                x: number;
                y: number;
              } | null
            }
            name={user.name}
          />
          <div className="flex flex-wrap gap-x-4 gap-y-1 md:flex-col md:items-end md:gap-2 md:shrink-0">
            <Link
              href={`/profile/${user.id}`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("viewProfile")} →
            </Link>
            <Link
              href={`/profile/${user.id}?view=public`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("viewAsAnonymous")} →
            </Link>
          </div>
        </div>
      </div>

      <ProfileEditForm
        initialName={user.name || ""}
        initialGoogleName={session.user.name || ""}
        initialBio={user.bio || ""}
        initialInstagram={user.instagram || ""}
        initialTwitter={user.twitter || ""}
        initialLinkedin={user.linkedin || ""}
        initialWebsite={user.website || ""}
        initialCity={user.city || ""}
        initialStateProvince={user.stateProvince || ""}
        initialCountry={user.country || ""}
        initialLanguage={user.language || "en"}
        initialFeaturedSubmissionId={user.featuredSubmissionId || ""}
        submissions={submissions.map((s) => ({
          id: s.id,
          title: s.title,
          imageUrl: s.imageUrl,
          text: s.text,
          wordIndex: s.wordIndex,
          isPortfolio: s.isPortfolio,
          tags: s.tags,
          category: s.category,
          prompt: s.prompt
            ? {
                word1: s.prompt.word1,
                word2: s.prompt.word2,
                word3: s.prompt.word3,
              }
            : null,
          shareStatus: s.shareStatus,
        }))}
        portfolioItemCount={portfolioItemCount}
      />
    </PageLayout>
  );
}
