import { getExhibitionSubmissions } from "@/lib/exhibition";
import { getExhibitById } from "@/lib/exhibits";
import { getCreatorUrl } from "@/lib/utils";
import { ExhibitViewSelector } from "@/components/exhibit-view-selector";
import { ExpandableBio } from "@/components/expandable-bio";
import { InspireTitle } from "@/components/inspire-page-header";
import { PageLayout } from "@/components/page-layout";
import {
  SketchbookView,
  type SketchbookItem,
} from "@/components/sketchbook/sketchbook-view";

interface SketchbookContentProps {
  exhibitId?: string;
}

const SUBMISSIONS_LIMIT = 50;

export async function SketchbookContent({ exhibitId }: SketchbookContentProps) {
  const [exhibit, { submissions }] = await Promise.all([
    exhibitId ? getExhibitById(exhibitId) : Promise.resolve(null),
    getExhibitionSubmissions({
      exhibitId,
      skip: 0,
      take: SUBMISSIONS_LIMIT,
    }),
  ]);

  const title = exhibit?.title ?? "Create Spot Permanent Exhibit";

  const pages: SketchbookItem[] = submissions.map((submission) => ({
    id: submission.id,
    title: submission.title,
    imageUrl: submission.imageUrl,
    imageFocalPoint: submission.imageFocalPoint as {
      x: number;
      y: number;
    } | null,
    text: submission.text,
    authorName: submission.user.name,
    href: `${getCreatorUrl(submission.user)}/s/${submission.id}`,
  }));

  return (
    <PageLayout maxWidth="max-w-6xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <InspireTitle>{title}</InspireTitle>
          {exhibit?.description && (
            <ExpandableBio
              html={exhibit.description}
              className="text-muted-foreground"
            />
          )}
        </div>
        <ExhibitViewSelector
          currentView="sketchbook"
          exhibitId={exhibitId}
          allowedViewTypes={exhibit?.allowedViewTypes}
        />
      </div>

      <SketchbookView
        items={pages}
        emptyStateLabel="No pages are available for this exhibit yet."
      />
    </PageLayout>
  );
}
