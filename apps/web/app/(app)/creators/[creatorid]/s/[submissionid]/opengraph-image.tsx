import { ImageResponse } from "next/og";
import { getFirstSentences } from "@/lib/collection-export";
import {
  canShowSubmissionForOg,
  createOgFullBleedImageResponse,
  createOgNotFoundResponse,
  fetchImageAsPngDataUrlForOg,
  OG_IMAGE_CONTENT_TYPE as contentType,
  OG_IMAGE_SIZE as size,
} from "@/lib/og-image";
import { prisma } from "@/lib/prisma";

export { size, contentType };

interface RouteParams {
  params: Promise<{ creatorid: string; submissionid: string }>;
}

export default async function OpenGraphImage({ params }: RouteParams) {
  const { creatorid, submissionid } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id: submissionid },
    include: {
      prompt: {
        select: {
          word1: true,
          word2: true,
          word3: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!canShowSubmissionForOg(submission, creatorid)) {
    return createOgNotFoundResponse("Submission Not Found");
  }

  const hasImage = !!submission.imageUrl;
  const title =
    submission.title ||
    (submission.prompt && submission.wordIndex
      ? `Submission for "${[submission.prompt.word1, submission.prompt.word2, submission.prompt.word3][submission.wordIndex - 1]}"`
      : "Portfolio Piece");

  if (hasImage && submission.imageUrl) {
    const focalPoint = submission.imageFocalPoint as {
      x: number;
      y: number;
    } | null;
    const imageDataUrl = await fetchImageAsPngDataUrlForOg(
      submission.imageUrl,
      {
        width: size.width,
        height: size.height,
        focalPoint: focalPoint ?? undefined,
      },
    );
    if (imageDataUrl) {
      return createOgFullBleedImageResponse(imageDataUrl, title);
    }
  }

  // Text-only submission: simple full-bleed, no overlays
  const hasText = !!submission.text;
  const textPreview = hasText ? getFirstSentences(submission.text!, 300) : "";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#18181b",
        padding: "80px",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: "32px",
          color: "#ffffff",
          lineHeight: "1.6",
          maxWidth: "100%",
          textAlign: "left",
          fontStyle: textPreview ? "normal" : "italic",
        }}
      >
        {textPreview || "Text submission"}
      </div>
    </div>,
    { ...size },
  );
}
