import { ImageResponse } from "next/og";
import { getFirstSentences } from "@/lib/collection-export";
import {
  createOgFullBleedImageResponse,
  createOgNotFoundResponse,
  fetchImageAsPngDataUrlForOg,
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
          image: true,
        },
      },
      featuredSubmission: {
        select: {
          id: true,
          imageUrl: true,
          imageFocalPoint: true,
          shareStatus: true,
        },
      },
      submissions: {
        include: {
          submission: {
            select: {
              id: true,
              imageUrl: true,
              imageFocalPoint: true,
              shareStatus: true,
            },
          },
        },
        orderBy: {
          order: "asc",
        },
        take: 1,
      },
    },
  });

  if (!exhibit) {
    return createOgNotFoundResponse("Exhibit Not Found");
  }

  // Fallback chain for image selection (only use submission images when PUBLIC/PROFILE)
  let imageUrl: string | null = null;
  let imageFocalPoint: { x: number; y: number } | null = null;

  // 1. Try featured submission image
  if (
    exhibit.featuredSubmission?.imageUrl &&
    isSubmissionVisibleForPublicOg(exhibit.featuredSubmission)
  ) {
    imageUrl = exhibit.featuredSubmission.imageUrl;
    imageFocalPoint = exhibit.featuredSubmission.imageFocalPoint as {
      x: number;
      y: number;
    } | null;
  }
  // 2. Try first submission in exhibit
  else if (exhibit.submissions.length > 0) {
    const firstSubmission = exhibit.submissions[0].submission;
    if (
      firstSubmission.imageUrl &&
      isSubmissionVisibleForPublicOg(firstSubmission)
    ) {
      imageUrl = firstSubmission.imageUrl;
      imageFocalPoint = firstSubmission.imageFocalPoint as {
        x: number;
        y: number;
      } | null;
    }
  }
  // 3. Try curator profile image
  else if (exhibit.curator.image) {
    imageUrl = exhibit.curator.image;
  }

  const title = exhibit.title;
  const description = exhibit.description
    ? getFirstSentences(exhibit.description, 200)
    : "";
  const curatorName = exhibit.curator.name || "Anonymous";

  if (imageUrl) {
    const imageDataUrl = await fetchImageAsPngDataUrlForOg(imageUrl, {
      width: size.width,
      height: size.height,
      focalPoint: imageFocalPoint ?? undefined,
    });
    if (imageDataUrl) {
      return createOgFullBleedImageResponse(imageDataUrl, title);
    }
  }

  // Default/Create Spot logo version
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        background: "#ffffff",
      }}
    >
      <div
        style={{
          width: 480,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #ffffff 0%, #f4f4f5 100%)",
          padding: "60px",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "24px",
              color: "#71717a",
              fontWeight: "600",
              letterSpacing: "0.05em",
            }}
          >
            Create Spot
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "56px",
              fontWeight: "bold",
              color: "#000000",
              lineHeight: "1.2",
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
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
                color: "#ffffff",
                padding: "10px 20px",
                borderRadius: "9999px",
                fontSize: "24px",
                fontWeight: "600",
              }}
            >
              Exhibit
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "24px",
                color: "#71717a",
              }}
            >
              Curated by {curatorName}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "28px",
              color: "#a1a1aa",
              fontWeight: "600",
            }}
          >
            Create Spot
          </div>
        </div>
      </div>

      <div
        style={{
          width: 720,
          height: "100%",
          display: "flex",
          background: "#18181b",
          padding: "60px",
          alignItems: "center",
          justifyContent: "center",
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
            fontStyle: description ? "normal" : "italic",
          }}
        >
          {description || "Create Spot Exhibitions"}
        </div>
      </div>
    </div>,
    { ...size },
  );
}
