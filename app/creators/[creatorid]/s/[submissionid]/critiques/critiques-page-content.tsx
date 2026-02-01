"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CritiquesPanel } from "@/components/critiques-panel";
import { SubmissionImage } from "@/components/submission-image";
import { ExpandableText } from "@/components/expandable-text";
import { Card, CardContent } from "@/components/ui/card";

interface CritiquesPageContentProps {
  submission: {
    id: string;
    title: string | null;
    imageUrl: string | null;
    imageFocalPoint?: { x: number; y: number } | null;
    text: string | null;
    user: { id: string; name: string | null; slug: string | null };
    tags: string[];
  };
  creatorid: string;
  isOwner: boolean;
  currentUserId: string;
  submissionPageHref: string;
}

function SubmissionPanel({
  submission,
}: {
  submission: CritiquesPageContentProps["submission"];
}) {
  const tSubmission = useTranslations("submission");
  const tExhibition = useTranslations("exhibition");
  const hasImage = !!submission.imageUrl;
  const hasText = !!submission.text;

  return (
    <div className="flex flex-col gap-4">
      {hasImage && (
        <SubmissionImage
          imageUrl={submission.imageUrl!}
          alt={submission.title || tSubmission("submissionAlt")}
          imageFocalPoint={submission.imageFocalPoint}
          tags={submission.tags}
          heightClasses="h-[65vh] sm:h-[72vh]"
        />
      )}
      {hasText && (
        <Card className="rounded-xl">
          <CardContent className="p-6">
            <ExpandableText text={submission.text!} title={submission.title} />
          </CardContent>
        </Card>
      )}
      {!hasImage && !hasText && (
        <p className="text-sm text-muted-foreground">
          {tExhibition("untitled")}
        </p>
      )}
    </div>
  );
}

export function CritiquesPageContent({
  submission,
  creatorid: _creatorid,
  isOwner,
  currentUserId,
  submissionPageHref,
}: CritiquesPageContentProps) {
  const t = useTranslations("critique");
  const tExhibition = useTranslations("exhibition");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {t.rich(isOwner ? "allCritiquesFor" : "yourCritiquesFor", {
              title: submission.title || tExhibition("untitled"),
              link: (chunks) => (
                <Link
                  href={submissionPageHref}
                  className="font-bold hover:underline focus:underline focus:outline-none"
                >
                  {chunks}
                </Link>
              ),
            })}
          </h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="min-w-0 overflow-y-auto">
            <CritiquesPanel
              submissionId={submission.id}
              isOwner={isOwner}
              currentUserId={currentUserId}
              submissionTitle={submission.title}
            />
          </div>

          <aside className="relative md:sticky md:top-6 md:max-h-[calc(100vh-8rem)] overflow-visible">
            <div
              className="absolute -left-8 top-0 z-10 hidden h-0.5 w-8 bg-primary/30 pointer-events-none lg:block"
              aria-hidden
            />
            <div className="md:max-h-[calc(100vh-8rem)] md:overflow-y-auto lg:border-l-2 lg:border-primary/30 lg:pl-8">
              <SubmissionPanel submission={submission} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
