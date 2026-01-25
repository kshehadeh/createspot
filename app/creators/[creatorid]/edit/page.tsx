import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { ProfileHeader } from "@/components/profile-header";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { getCreatorUrl } from "@/lib/utils";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface ProfileEditPageProps {
  params: Promise<{ creatorid: string }>;
}

export default async function ProfileEditPage({
  params,
}: ProfileEditPageProps) {
  const { creatorid } = await params;
  const session = await auth();
  const t = await getTranslations("profile");

  if (!session?.user?.id) {
    redirect("/");
  }

  // Find user by slug or ID
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ slug: creatorid }, { id: creatorid }],
    },
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
      slug: true,
      featuredSubmissionId: true,
      profileImageUrl: true,
      profileImageFocalPoint: true,
      // Image protection settings
      enableWatermark: true,
      watermarkPosition: true,
      protectFromDownload: true,
      protectFromAI: true,
      emailOnFavorite: true,
      emailFeatureUpdates: true,
      emailOnBadgeAward: true,
      tutorial: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  // Fetch all user submissions for the featured piece selector (up to 100)
  const submissions = await prisma.submission.findMany({
    where: { userId: user.id },
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
      userId: user.id,
      isPortfolio: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  // Ensure user can only edit their own profile
  if (session.user.id !== user.id) {
    // Note: For redirects to own profile, we use ID since we don't have slug in session
    redirect(`/creators/${session.user.id}/edit`);
  }

  return (
    <PageLayout maxWidth="max-w-5xl" className="w-full">
      <div className="mb-8">
        <div className="flex items-start gap-4">
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
            showText={false}
          />
          <div className="flex-1 min-w-0">
            <PageHeader
              title={user.name || t("anonymous")}
              subtitle={t("editSubtitle")}
              rightContent={
                <div className="flex flex-row flex-wrap items-end justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={getCreatorUrl(user)}>
                      <Eye className="h-4 w-4" />
                      <span className="hidden md:inline">
                        {t("viewProfile")}
                      </span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`${getCreatorUrl(user)}?view=public`}>
                      <Eye className="h-4 w-4" />
                      <span className="hidden md:inline">
                        {t("viewAsAnonymous")}
                      </span>
                    </Link>
                  </Button>
                </div>
              }
            />
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
        initialSlug={user.slug}
        initialFeaturedSubmissionId={user.featuredSubmissionId || ""}
        // Image protection settings
        initialEnableWatermark={user.enableWatermark}
        initialWatermarkPosition={user.watermarkPosition}
        initialProtectFromDownload={user.protectFromDownload}
        initialProtectFromAI={user.protectFromAI}
        initialEmailOnFavorite={user.emailOnFavorite}
        initialEmailFeatureUpdates={user.emailFeatureUpdates}
        initialEmailOnBadgeAward={user.emailOnBadgeAward}
        tutorial={user.tutorial}
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
