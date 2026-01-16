import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExhibitById } from "@/lib/exhibits";
import { GalleryContent } from "../gallery-content";

export const dynamic = "force-dynamic";

interface GalleryExhibitPageProps {
  params: Promise<{ exhibitId: string }>;
  searchParams: Promise<{
    category?: string | string[];
    tag?: string | string[];
    q?: string | string[];
  }>;
}

export async function generateMetadata({
  params,
}: GalleryExhibitPageProps): Promise<Metadata> {
  const { exhibitId } = await params;
  const exhibit = await getExhibitById(exhibitId);

  if (!exhibit) {
    return {
      title: "Exhibit Not Found | Create Spot",
    };
  }

  function getDescription(text: string): string {
    const cleanText = text.replace(/<[^>]*>/g, "").trim();
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences.length > 0) {
      return sentences[0].trim();
    }
    return cleanText.slice(0, 200);
  }

  const description = exhibit.description
    ? getDescription(exhibit.description)
    : `Browse the ${exhibit.title} exhibit in gallery view.`;

  return {
    title: `${exhibit.title} | Exhibit | Create Spot`,
    description,
    openGraph: {
      title: `${exhibit.title} | Exhibit | Create Spot`,
      description,
      type: "website",
    },
  };
}

export default async function GalleryExhibitPage({
  params,
  searchParams,
}: GalleryExhibitPageProps) {
  const [{ exhibitId }, paramsSearch] = await Promise.all([
    params,
    searchParams,
  ]);

  // Verify exhibit exists
  const exhibit = await getExhibitById(exhibitId);
  if (!exhibit) {
    notFound();
  }

  const category = Array.isArray(paramsSearch.category)
    ? paramsSearch.category[0]
    : paramsSearch.category;
  const tag = Array.isArray(paramsSearch.tag)
    ? paramsSearch.tag[0]
    : paramsSearch.tag;
  const query = Array.isArray(paramsSearch.q)
    ? paramsSearch.q[0]
    : paramsSearch.q;

  return (
    <GalleryContent
      exhibitId={exhibitId}
      searchParams={{
        category: category?.trim() || "",
        tag: tag?.trim() || "",
        q: query?.trim() || "",
      }}
    />
  );
}
