import { getExhibitionSubmissions } from "@/lib/exhibition";
import { EXHIBITION_PAGE_SIZE } from "@/lib/exhibition-constants";
import { HomeGrid } from "@/app/home-grid";

export async function HomeContent() {
  "use cache";

  const { submissions, hasMore } = await getExhibitionSubmissions({
    skip: 0,
    take: EXHIBITION_PAGE_SIZE,
  });

  const initialSubmissions = submissions.map((submission) => ({
    ...submission,
    imageFocalPoint: submission.imageFocalPoint as
      | { x: number; y: number }
      | null
      | undefined,
    tags: submission.tags ?? [],
    category: submission.category ?? null,
  }));

  return (
    <HomeGrid
      initialSubmissions={initialSubmissions}
      initialHasMore={hasMore}
      isLoggedIn={false}
    />
  );
}
