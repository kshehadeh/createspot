import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";

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

  // If there's an image, try to fetch it and convert to data URL for reliable rendering
  if (imageUrl) {
    try {
      const imageResponse = await fetch(imageUrl);
      if (imageResponse.ok) {
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Get image metadata first (need to rotate to get correct dimensions)
        const rotatedBuffer = await sharp(buffer).rotate().toBuffer();
        const metadata = await sharp(rotatedBuffer).metadata();
        const originalWidth = metadata.width || 1;
        const originalHeight = metadata.height || 1;

        const focalPoint = imageFocalPoint;

        // Target aspect ratio for OG image
        const targetAspectRatio = size.width / size.height;
        const originalAspectRatio = originalWidth / originalHeight;

        let processedBuffer: Buffer;

        if (focalPoint) {
          // Calculate crop dimensions to match target aspect ratio
          let cropWidth: number;
          let cropHeight: number;

          if (originalAspectRatio > targetAspectRatio) {
            cropHeight = originalHeight;
            cropWidth = cropHeight * targetAspectRatio;
          } else {
            cropWidth = originalWidth;
            cropHeight = cropWidth / targetAspectRatio;
          }

          cropWidth = Math.min(cropWidth, originalWidth);
          cropHeight = Math.min(cropHeight, originalHeight);

          const focalX = (focalPoint.x / 100) * originalWidth;
          const focalY = (focalPoint.y / 100) * originalHeight;

          let left = focalX - cropWidth / 2;
          let top = focalY - cropHeight / 2;

          left = Math.max(0, Math.min(left, originalWidth - cropWidth));
          top = Math.max(0, Math.min(top, originalHeight - cropHeight));

          processedBuffer = await sharp(rotatedBuffer)
            .extract({
              left: Math.round(left),
              top: Math.round(top),
              width: Math.round(cropWidth),
              height: Math.round(cropHeight),
            })
            .resize(size.width, size.height, {
              fit: "cover",
            })
            .toBuffer();
        } else {
          processedBuffer = await sharp(rotatedBuffer)
            .resize(size.width, size.height, {
              fit: "cover",
            })
            .toBuffer();
        }

        const base64 = processedBuffer.toString("base64");
        const contentType =
          imageResponse.headers.get("content-type") || "image/jpeg";
        const imageDataUrl = `data:${contentType};base64,${base64}`;

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
    } catch (error) {
      console.error("Failed to load image for OG:", error);
      // Fall through to text-only version
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
