import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface ExhibitionPageProps {
  searchParams: Promise<{
    category?: string | string[];
    tag?: string | string[];
    q?: string | string[];
  }>;
}

export default async function ExhibitionPage({
  searchParams,
}: ExhibitionPageProps) {
  const params = await searchParams;
  const searchParamsString = new URLSearchParams();

  if (params.category) {
    const category = Array.isArray(params.category)
      ? params.category[0]
      : params.category;
    if (category) searchParamsString.set("category", category);
  }

  if (params.tag) {
    const tag = Array.isArray(params.tag) ? params.tag[0] : params.tag;
    if (tag) searchParamsString.set("tag", tag);
  }

  if (params.q) {
    const query = Array.isArray(params.q) ? params.q[0] : params.q;
    if (query) searchParamsString.set("q", query);
  }

  const queryString = searchParamsString.toString();
  redirect(`/exhibition/gallery${queryString ? `?${queryString}` : ""}`);
}
