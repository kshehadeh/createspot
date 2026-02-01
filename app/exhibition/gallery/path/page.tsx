import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getExhibitionSubmissions } from "@/lib/exhibition";
import { PageLayout } from "@/components/page-layout";
import { ConstellationExhibitHeader } from "../../constellation/constellation-exhibit-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Path Exhibition | Create Spot",
  description:
    "Explore the community gallery in a flowing visual journey. Discover creative work from the Create Spot community.",
  openGraph: {
    title: "Path Exhibition | Create Spot",
    description:
      "Explore the community gallery in a flowing visual journey. Discover creative work from the Create Spot community.",
    type: "website",
  },
};

interface PathExhibitionPageProps {
  searchParams: Promise<{
    exhibitId?: string | string[];
  }>;
}

export default async function PathExhibitionPage({
  searchParams,
}: PathExhibitionPageProps) {
  const [_session, params] = await Promise.all([auth(), searchParams]);

  const rawExhibitId = Array.isArray(params.exhibitId)
    ? params.exhibitId[0]
    : params.exhibitId;

  const exhibitId = rawExhibitId?.trim() || undefined;

  // Handle backward compatibility: redirect old query param format to new route format
  if (exhibitId) {
    redirect(`/exhibition/gallery/path/${exhibitId}`);
  }

  const { submissions } = await getExhibitionSubmissions({
    exhibitId: undefined,
    skip: 0,
    take: 50,
  });

  const exhibitTitle = "Create Spot Permanent Exhibit";

  // Transform submissions to constellation format
  const constellationWork = submissions.map((submission) => {
    const promptWord =
      submission.prompt && typeof submission.wordIndex === "number"
        ? ([
            submission.prompt.word1,
            submission.prompt.word2,
            submission.prompt.word3,
          ][submission.wordIndex - 1] ?? null)
        : null;

    return {
      id: submission.id,
      imageUrl: submission.imageUrl,
      text: submission.text,
      title: submission.title,
      promptWord,
      shareStatus: submission.shareStatus,
      critiquesEnabled: submission.critiquesEnabled,
      user: submission.user,
    };
  });

  return (
    <PageLayout maxWidth="max-w-none">
      <ConstellationExhibitHeader
        exhibitTitle={exhibitTitle}
        exhibit={null}
        exhibitId={undefined}
        items={constellationWork}
        className="pb-20"
      />
    </PageLayout>
  );
}
