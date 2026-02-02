import { ImageResponse } from "next/og";
import { getFirstSentences } from "@/lib/collection-export";
import {
  createOgFullBleedImageResponse,
  createOgNotFoundResponse,
  fetchImageAsPngDataUrl,
  isSubmissionVisibleForPublicOg,
  OG_IMAGE_CONTENT_TYPE as contentType,
  OG_IMAGE_SIZE as size,
} from "@/lib/og-image";
import { prisma } from "@/lib/prisma";

export { size, contentType };

interface RouteParams {
  params: Promise<{ exhibitId: string }>;
}

export default async function OpenGraphImage({ params }: RouteParams) {
  const { exhibitId } = await params;

  const exhibit = await prisma.exhibit.findUnique({
    where: { id: exhibitId },
    include: {
      curator: {
        select: {
          name: true,
        },
      },
      featuredSubmission: {
        select: {
          imageUrl: true,
          shareStatus: true,
        },
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  });

  if (!exhibit) {
    return createOgNotFoundResponse("Exhibit Not Found");
  }

  const title = exhibit.title;
  const description = exhibit.description
    ? getFirstSentences(exhibit.description, 300)
    : "";
  const submissionCount = exhibit._count.submissions;

  const hasFeaturedImage =
    !!exhibit.featuredSubmission?.imageUrl &&
    isSubmissionVisibleForPublicOg(exhibit.featuredSubmission);

  if (hasFeaturedImage && exhibit.featuredSubmission?.imageUrl) {
    const imageDataUrl = await fetchImageAsPngDataUrl(
      exhibit.featuredSubmission.imageUrl,
    );
    if (imageDataUrl) {
      return createOgFullBleedImageResponse(imageDataUrl, title);
    }
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "linear-gradient(135deg, #ffffff 0%, #f4f4f5 100%)",
        padding: "80px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              backgroundColor: "#000000",
              padding: "12px 24px",
              borderRadius: "9999px",
              fontSize: "24px",
              color: "#ffffff",
              fontWeight: "600",
            }}
          >
            Exhibit
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "20px",
              color: "#71717a",
            }}
          >
            {submissionCount} works
          </div>
        </div>
        <div
          style={{
            fontSize: "72px",
            fontWeight: "bold",
            color: "#000000",
            lineHeight: "1.1",
          }}
        >
          {title}
        </div>
        {description && (
          <div
            style={{
              fontSize: "28px",
              color: "#71717a",
              maxWidth: "800px",
              lineHeight: "1.5",
            }}
          >
            {description}
          </div>
        )}
        <div
          style={{
            fontSize: "24px",
            color: "#a1a1aa",
            fontWeight: "600",
            marginTop: "auto",
          }}
        >
          Create Spot
        </div>
      </div>
    </div>,
    { ...size },
  );
}
