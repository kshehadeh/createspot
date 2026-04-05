/** Shared shape for main image + text + reference + progressions (feed, lightbox). */

export interface SubmissionProgressionInput {
  id: string;
  imageUrl: string | null;
  text: string | null;
  comment: string | null;
  order: number;
}

export interface SubmissionMediaInput {
  title: string | null;
  imageUrl: string | null;
  imageFocalPoint: { x: number; y: number } | null;
  text: string | null;
  referenceImageUrl: string | null;
  progressions: SubmissionProgressionInput[];
}

export type SubmissionSlide =
  | {
      type: "image";
      imageUrl: string;
      alt: string;
      focalPoint?: { x: number; y: number } | null;
    }
  | { type: "text"; html: string; title?: string | null }
  | { type: "reference"; imageUrl: string }
  | {
      type: "progression";
      imageUrl?: string | null;
      html?: string | null;
      comment?: string | null;
      label: string;
    };

export interface SubmissionSlidesLabels {
  submissionAlt: string;
  progressionStep: (step: number, total: number) => string;
}

export function buildSubmissionSlides(
  submission: SubmissionMediaInput,
  labels: SubmissionSlidesLabels,
): SubmissionSlide[] {
  const slides: SubmissionSlide[] = [];

  if (submission.imageUrl) {
    slides.push({
      type: "image",
      imageUrl: submission.imageUrl,
      alt: submission.title || labels.submissionAlt,
      focalPoint: submission.imageFocalPoint,
    });
  }

  if (submission.text) {
    slides.push({
      type: "text",
      html: submission.text,
      title: submission.title,
    });
  }

  if (submission.referenceImageUrl) {
    slides.push({ type: "reference", imageUrl: submission.referenceImageUrl });
  }

  submission.progressions.forEach((p, index) => {
    if (p.imageUrl || p.text) {
      slides.push({
        type: "progression",
        imageUrl: p.imageUrl,
        html: p.text,
        comment: p.comment,
        label: labels.progressionStep(
          index + 1,
          submission.progressions.length,
        ),
      });
    }
  });

  return slides;
}
