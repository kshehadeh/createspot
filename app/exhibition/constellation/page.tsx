import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getExhibitionSubmissions } from "@/lib/exhibition";
import { getExhibitById } from "@/lib/exhibits";
import { PageLayout } from "@/components/page-layout";
import { ConstellationExhibitHeader } from "./constellation-exhibit-header";

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

interface ConstellationExhibitionPageProps {
  searchParams: Promise<{
    exhibitId?: string | string[];
  }>;
}

export default async function ConstellationExhibitionPage({
  searchParams,
}: ConstellationExhibitionPageProps) {
  const [_session, params] = await Promise.all([auth(), searchParams]);

  const rawExhibitId = Array.isArray(params.exhibitId)
    ? params.exhibitId[0]
    : params.exhibitId;

  const exhibitId = rawExhibitId?.trim() || undefined;

  const [{ submissions }, exhibit] = await Promise.all([
    getExhibitionSubmissions({
      exhibitId,
      skip: 0,
      take: 50,
    }),
    exhibitId ? getExhibitById(exhibitId) : Promise.resolve(null),
  ]);

  const exhibitTitle = exhibit
    ? exhibit.title
    : "Create Spot Permanent Exhibit";

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
    };
  });

  return (
    <PageLayout maxWidth="max-w-none">
      <ConstellationExhibitHeader
        exhibitTitle={exhibitTitle}
        exhibit={
          exhibit
            ? {
                id: exhibit.id,
                title: exhibit.title,
                description: exhibit.description,
                curator: exhibit.curator,
                featuredArtist: exhibit.featuredArtist,
                featuredSubmission: exhibit.featuredSubmission,
                allowedViewTypes: exhibit.allowedViewTypes,
              }
            : null
        }
        exhibitId={exhibitId}
        items={constellationWork}
        className="pb-20"
      />
    </PageLayout>
  );
}
