import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface ConstellationExhibitionPageProps {
  searchParams: Promise<{
    exhibitId?: string | string[];
  }>;
}

export default async function ConstellationExhibitionPage({
  searchParams,
}: ConstellationExhibitionPageProps) {
  const params = await searchParams;

  // Redirect old /exhibition/constellation to /exhibition/gallery/path
  const rawExhibitId = Array.isArray(params.exhibitId)
    ? params.exhibitId[0]
    : params.exhibitId;

  const exhibitId = rawExhibitId?.trim();

  if (exhibitId) {
    redirect(`/exhibition/gallery/path/${exhibitId}`);
  }

  redirect("/exhibition/gallery/path");
}
