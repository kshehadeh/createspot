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
    // Support multiple categories for redirect
    const categoryParam = params.category;
    const categories = Array.isArray(categoryParam)
      ? categoryParam.filter((c) => c?.trim()).map((c) => c.trim())
      : categoryParam?.trim()
        ? [categoryParam.trim()]
        : [];
    // Support multiple tags for redirect
    const tagParam = params.tag;
    const tags = Array.isArray(tagParam)
      ? tagParam.filter((t) => t?.trim()).map((t) => t.trim())
      : tagParam?.trim()
        ? [tagParam.trim()]
        : [];
    const query = Array.isArray(params.q) ? params.q[0] : params.q;

    // Preserve all categories in redirect
    categories.forEach((category) => {
      filterParams.append("category", category);
    });
    // Preserve all tags in redirect
    tags.forEach((tag) => {
      filterParams.append("tag", tag);
    });
    if (query?.trim()) filterParams.set("q", query.trim());

    const queryString = filterParams.toString();
    const redirectUrl = queryString
      ? `/inspire/exhibition/gallery/grid/${exhibitId}?${queryString}`
      : `/inspire/exhibition/gallery/grid/${exhibitId}`;

    redirect(redirectUrl);
  }

  // Support multiple categories - normalize to array
  const categoryParam = params.category;
  const categories = Array.isArray(categoryParam)
    ? categoryParam.filter((c) => c?.trim()).map((c) => c.trim())
    : categoryParam?.trim()
      ? [categoryParam.trim()]
      : [];
  // Support multiple tags - normalize to array
  const tagParam = params.tag;
  const tags = Array.isArray(tagParam)
    ? tagParam.filter((t) => t?.trim()).map((t) => t.trim())
    : tagParam?.trim()
      ? [tagParam.trim()]
      : [];
  const query = Array.isArray(params.q) ? params.q[0] : params.q;

  return (
    <GalleryContent
      exhibitId={undefined}
      searchParams={{
        category: categories.length > 0 ? categories : undefined,
        tag: tags.length > 0 ? tags : undefined,
        q: query?.trim() || "",
      }}
    />
  );
}
