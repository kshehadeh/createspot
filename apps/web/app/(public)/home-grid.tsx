"use client";

import type { ExhibitionSubmission } from "@/app/(app)/inspire/exhibition/exhibition-grid";
import { ExhibitionGrid } from "@/app/(app)/inspire/exhibition/exhibition-grid";

interface HomeGridProps {
  initialSubmissions: ExhibitionSubmission[];
  initialHasMore: boolean;
  isLoggedIn: boolean;
}

export function HomeGrid({
  initialSubmissions,
  initialHasMore,
  isLoggedIn,
}: HomeGridProps) {
  return (
    <ExhibitionGrid
      submissions={initialSubmissions}
      isLoggedIn={isLoggedIn}
      initialHasMore={initialHasMore}
      loadMoreEndpoint="/api/exhibition"
      loadMoreParams={{}}
      priorityCount={2}
      lightboxUsesSessionProvider={true}
    />
  );
}
