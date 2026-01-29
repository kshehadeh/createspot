import { ImageResponse } from "next/og";
import { fetchImageAsPngDataUrlForOg } from "@/lib/og-image";
import { prisma } from "@/lib/prisma";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface RouteParams {
  params: Promise<{ exhibitId: string }>;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function getFirstSentences(text: string, maxLength: number = 200): string {
  const cleanText = stripHtml(text);
  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  // Try to find sentence boundaries
  const sentences = cleanText.match(/[^.!?]+[.!?]+/g);
  if (sentences) {
    let result = "";
    for (const sentence of sentences) {
      if (result.length + sentence.length > maxLength) {
        break;
      }
      result += sentence;
    }
    if (result) {
      return result.trim() + "...";
    }
  }

  // Fallback to truncation
  return cleanText.slice(0, maxLength).trim() + "...";
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
        },
      },
      submissions: {
        include: {
          submission: {
            select: {
              id: true,
              imageUrl: true,
              imageFocalPoint: true,
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
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #ffffff 0%, #f4f4f5 100%)",
        }}
      >
        <div
          style={{
            fontSize: "48px",
            fontWeight: "bold",
            color: "#000000",
          }}
        >
          Exhibit Not Found
        </div>
      </div>,
      { ...size },
    );
  }

  // Fallback chain for image selection
  let imageUrl: string | null = null;
  let imageFocalPoint: { x: number; y: number } | null = null;

  // 1. Try featured submission image
  if (exhibit.featuredSubmission?.imageUrl) {
    imageUrl = exhibit.featuredSubmission.imageUrl;
    imageFocalPoint = exhibit.featuredSubmission.imageFocalPoint as {
      x: number;
      y: number;
    } | null;
  }
  // 2. Try first submission in exhibit
  else if (exhibit.submissions.length > 0) {
    const firstSubmission = exhibit.submissions[0].submission;
    if (firstSubmission.imageUrl) {
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
      return new ImageResponse(
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            position: "relative",
          }}
        >
          <img
            src={imageDataUrl}
            alt={title}
            width={size.width}
            height={size.height}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
              padding: "60px 80px 80px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "64px",
                fontWeight: "bold",
                color: "#ffffff",
                lineHeight: "1.2",
                textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: "32px",
                color: "#e4e4e7",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span
                style={{
                  display: "flex",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  padding: "8px 16px",
                  borderRadius: "9999px",
                  fontSize: "24px",
                }}
              >
                Exhibit
              </span>
              <span style={{ display: "flex", fontSize: "28px" }}>
                Curated by {curatorName}
              </span>
            </div>
            {description && (
              <div
                style={{
                  fontSize: "24px",
                  color: "#d4d4d8",
                  maxWidth: 600,
                }}
              >
                {description}
              </div>
            )}
          </div>
        </div>,
        { ...size },
      );
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
