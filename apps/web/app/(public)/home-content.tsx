import { getExhibitionSubmissions } from "@/lib/exhibition";
import { EXHIBITION_PAGE_SIZE } from "@/lib/exhibition-constants";
import { HomeGrid } from "./home-grid";

const LOG_INIT_RENDER =
  process.env.NODE_ENV === "development" &&
  process.env.INIT_RENDER_DEBUG !== "0";

export async function HomeContent() {
  "use cache";

  const { submissions, hasMore } = await getExhibitionSubmissions({
    skip: 0,
    take: EXHIBITION_PAGE_SIZE,
  });
  if (LOG_INIT_RENDER) {
    const after = Date.now();
    console.log(
      "[INIT-RENDER] home-content getExhibitionSubmissions done at",
      after,
    );
  }

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
