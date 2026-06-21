import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SketchbookContent } from "../sketchbook-content";

export const metadata: Metadata = {
  title: "Sketchbook Exhibition | Create Spot",
  description:
    "Browse public work from the Create Spot community in sketchbook view.",
  openGraph: {
    title: "Sketchbook Exhibition | Create Spot",
    description:
      "Browse public work from the Create Spot community in sketchbook view.",
    type: "website",
  },
};

interface SketchbookExhibitionPageProps {
  searchParams: Promise<{
    exhibitId?: string | string[];
  }>;
}

export default async function SketchbookExhibitionPage({
  searchParams,
}: SketchbookExhibitionPageProps) {
  const params = await searchParams;
  const rawExhibitId = Array.isArray(params.exhibitId)
    ? params.exhibitId[0]
    : params.exhibitId;
  const exhibitId = rawExhibitId?.trim();

  if (exhibitId) {
    redirect(`/inspire/exhibition/gallery/sketchbook/${exhibitId}`);
  }

  return <SketchbookContent />;
}
