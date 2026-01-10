import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getExhibitById } from "@/lib/exhibits";
import { PageLayout } from "@/components/page-layout";
import { GlobalExhibitionWrapper } from "./global-exhibition-wrapper";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Map Exhibition | Create Spot",
  description:
    "Explore artists from around the world on an interactive map. Discover creative work from the Create Spot community across the globe.",
  openGraph: {
    title: "Map Exhibition | Create Spot",
    description:
      "Explore artists from around the world on an interactive map. Discover creative work from the Create Spot community across the globe.",
    type: "website",
  },
};

interface GlobalExhibitionPageProps {
  searchParams: Promise<{
    exhibitId?: string | string[];
  }>;
}

export default async function GlobalExhibitionPage({
  searchParams,
}: GlobalExhibitionPageProps) {
  const [_session, params] = await Promise.all([auth(), searchParams]);
  const rawExhibitId = Array.isArray(params.exhibitId)
    ? params.exhibitId[0]
    : params.exhibitId;
  const exhibitId = rawExhibitId?.trim() || undefined;

  const exhibit = exhibitId ? await getExhibitById(exhibitId) : null;
  const exhibitTitle = exhibit
    ? exhibit.title
    : "Create Spot Permanent Exhibit";

  return (
    <PageLayout
      maxWidth="max-w-none"
      className="w-full !py-0 flex flex-col"
      withPadding={false}
    >
      <GlobalExhibitionWrapper
        exhibitTitle={exhibitTitle}
        exhibit={
          exhibit
            ? {
                id: exhibit.id,
                title: exhibit.title,
                description: exhibit.description,
                curator: exhibit.curator,
                featuredArtist: exhibit.featuredArtist,
                allowedViewTypes: exhibit.allowedViewTypes,
              }
            : null
        }
        exhibitId={exhibitId}
      />
    </PageLayout>
  );
}
