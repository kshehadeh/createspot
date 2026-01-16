import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getExhibitionSubmissions } from "@/lib/exhibition";
import { getExhibitById } from "@/lib/exhibits";
import { PageLayout } from "@/components/page-layout";
import { ConstellationExhibitHeader } from "../../../constellation/constellation-exhibit-header";

export const dynamic = "force-dynamic";

interface PathExhibitPageProps {
  params: Promise<{ exhibitId: string }>;
}

export async function generateMetadata({
  params,
}: PathExhibitPageProps): Promise<Metadata> {
  const { exhibitId } = await params;
  const exhibit = await getExhibitById(exhibitId);

  if (!exhibit) {
    return {
      title: "Exhibit Not Found | Create Spot",
    };
  }

  return {
    title: `${exhibit.title} - Path | Create Spot`,
    description: exhibit.description
      ? exhibit.description
          .replace(/<[^>]*>/g, "")
          .trim()
          .slice(0, 200)
      : `Explore the ${exhibit.title} exhibit in path view.`,
    openGraph: {
      title: `${exhibit.title} - Path | Create Spot`,
      description: exhibit.description
        ? exhibit.description
            .replace(/<[^>]*>/g, "")
            .trim()
            .slice(0, 200)
        : `Explore the ${exhibit.title} exhibit in path view.`,
      type: "website",
    },
  };
}

export default async function PathExhibitPage({
  params,
}: PathExhibitPageProps) {
  const { exhibitId } = await params;
  const [_session, exhibit] = await Promise.all([
    auth(),
    getExhibitById(exhibitId),
  ]);

  if (!exhibit) {
    notFound();
  }

  const { submissions } = await getExhibitionSubmissions({
    exhibitId,
    skip: 0,
    take: 50,
  });

  const exhibitTitle = exhibit.title;

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
        exhibit={{
          id: exhibit.id,
          title: exhibit.title,
          description: exhibit.description,
          curator: exhibit.curator,
          featuredArtist: exhibit.featuredArtist,
          featuredSubmission: exhibit.featuredSubmission,
          allowedViewTypes: exhibit.allowedViewTypes,
        }}
        exhibitId={exhibitId}
        items={constellationWork}
        className="pb-20"
      />
    </PageLayout>
  );
}
