import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GalleryContent } from "../gallery-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Grid Exhibition | Create Spot",
  description:
    "Browse public work from the Create Spot community. Filter by category or tag, or search by keyword to find your next source of inspiration.",
  openGraph: {
    title: "Grid Exhibition | Create Spot",
    description:
      "Browse public work from the Create Spot community. Filter by category or tag, or search by keyword to find your next source of inspiration.",
    type: "website",
  },
};

interface GridExhibitionPageProps {
  searchParams: Promise<{
    category?: string | string[];
    tag?: string | string[];
    q?: string | string[];
    exhibitId?: string | string[];
  }>;
}

export default async function GridExhibitionPage({
  searchParams,
}: GridExhibitionPageProps) {
  const params = await searchParams;

  // Handle backward compatibility: redirect old query param format to new route format
  const rawExhibitId = Array.isArray(params.exhibitId)
    ? params.exhibitId[0]
    : params.exhibitId;
  const exhibitId = rawExhibitId?.trim();

  if (exhibitId) {
    // Build redirect URL with filter params preserved
    const filterParams = new URLSearchParams();
    const category = Array.isArray(params.category)
      ? params.category[0]
      : params.category;
    const tag = Array.isArray(params.tag) ? params.tag[0] : params.tag;
    const query = Array.isArray(params.q) ? params.q[0] : params.q;

    if (category?.trim()) filterParams.set("category", category.trim());
    if (tag?.trim()) filterParams.set("tag", tag.trim());
    if (query?.trim()) filterParams.set("q", query.trim());

    const queryString = filterParams.toString();
    const redirectUrl = queryString
      ? `/exhibition/gallery/grid/${exhibitId}?${queryString}`
      : `/exhibition/gallery/grid/${exhibitId}`;

    redirect(redirectUrl);
  }

  const category = Array.isArray(params.category)
    ? params.category[0]
    : params.category;
  const tag = Array.isArray(params.tag) ? params.tag[0] : params.tag;
  const query = Array.isArray(params.q) ? params.q[0] : params.q;

  return (
    <GalleryContent
      exhibitId={undefined}
      searchParams={{
        category: category?.trim() || "",
        tag: tag?.trim() || "",
        q: query?.trim() || "",
      }}
    />
  );
}
