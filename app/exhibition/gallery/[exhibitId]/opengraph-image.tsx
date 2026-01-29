import { ImageResponse } from "next/og";
import { fetchImageAsPngDataUrl } from "@/lib/og-image";
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
        },
      },
      featuredSubmission: {
        select: {
          imageUrl: true,
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

  const title = exhibit.title;
  const description = exhibit.description
    ? getFirstSentences(exhibit.description, 300)
    : "";
  const submissionCount = exhibit._count.submissions;

  // Use featured submission image if available
  const hasFeaturedImage = !!exhibit.featuredSubmission?.imageUrl;

  if (hasFeaturedImage) {
    const imageDataUrl = await fetchImageAsPngDataUrl(
      exhibit.featuredSubmission!.imageUrl!,
    );
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
                "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)",
              padding: "60px 80px 80px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
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
                  backgroundColor: "rgba(255,255,255,0.2)",
                  padding: "8px 16px",
                  borderRadius: "9999px",
                  fontSize: "20px",
                  color: "#ffffff",
                  fontWeight: "600",
                }}
              >
                Exhibit
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "18px",
                  color: "#e4e4e7",
                }}
              >
                {submissionCount} works
              </div>
            </div>
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
            {description && (
              <div
                style={{
                  fontSize: "24px",
                  color: "#e4e4e7",
                  maxWidth: "80%",
                }}
              >
                {description}
              </div>
            )}
            <div
              style={{
                fontSize: "20px",
                color: "#a1a1aa",
              }}
            >
              Create Spot
            </div>
          </div>
        </div>,
        { ...size },
      );
    }
  }

  // Text-only version (no featured image or failed to load)
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
