import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExhibitById } from "@/lib/exhibits";
import { SketchbookContent } from "../../sketchbook-content";

interface SketchbookExhibitPageProps {
  params: Promise<{ exhibitId: string }>;
}

function summarizeDescription(description: string): string {
  const plain = description.replace(/<[^>]*>/g, "").trim();
  const firstSentence = plain.match(/[^.!?]+[.!?]+/g)?.[0]?.trim();
  return firstSentence || plain.slice(0, 200);
}

export async function generateMetadata({
  params,
}: SketchbookExhibitPageProps): Promise<Metadata> {
  const { exhibitId } = await params;
  const exhibit = await getExhibitById(exhibitId);

  if (!exhibit) {
    return {
      title: "Exhibit Not Found | Create Spot",
    };
  }

  return {
    title: `${exhibit.title} | Sketchbook | Create Spot`,
    description: exhibit.description
      ? summarizeDescription(exhibit.description)
      : `Browse ${exhibit.title} in sketchbook view.`,
    openGraph: {
      title: `${exhibit.title} | Sketchbook | Create Spot`,
      description: exhibit.description
        ? summarizeDescription(exhibit.description)
        : `Browse ${exhibit.title} in sketchbook view.`,
      type: "website",
    },
  };
}

export default async function SketchbookExhibitPage({
  params,
}: SketchbookExhibitPageProps) {
  const { exhibitId } = await params;
  const exhibit = await getExhibitById(exhibitId);

  if (!exhibit) {
    notFound();
  }

  return <SketchbookContent exhibitId={exhibitId} />;
}
