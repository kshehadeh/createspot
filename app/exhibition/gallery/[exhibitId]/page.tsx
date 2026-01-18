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

  // Support multiple categories - normalize to array
  const categoryParam = paramsSearch.category;
  const categories = Array.isArray(categoryParam)
    ? categoryParam.filter((c) => c?.trim()).map((c) => c.trim())
    : categoryParam?.trim()
      ? [categoryParam.trim()]
      : [];
  // Support multiple tags - normalize to array
  const tagParam = paramsSearch.tag;
  const tags = Array.isArray(tagParam)
    ? tagParam.filter((t) => t?.trim()).map((t) => t.trim())
    : tagParam?.trim()
      ? [tagParam.trim()]
      : [];
  const query = Array.isArray(paramsSearch.q)
    ? paramsSearch.q[0]
    : paramsSearch.q;

  return (
    <GalleryContent
      exhibitId={exhibitId}
      searchParams={{
        category: categories.length > 0 ? categories : undefined,
        tag: tags.length > 0 ? tags : undefined,
        q: query?.trim() || "",
      }}
    />
  );
}
