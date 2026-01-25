import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface RouteParams {
  params: Promise<{ creatorid: string; submissionid: string }>;
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

  if (!submission || submission.userId !== creatorid) {
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
          Submission Not Found
        </div>
      </div>,
      { ...size },
    );
  }

  const hasPrompt = !!submission.prompt && !!submission.wordIndex;
  const word = hasPrompt
    ? [
        submission.prompt!.word1,
        submission.prompt!.word2,
        submission.prompt!.word3,
      ][submission.wordIndex! - 1]
    : "Portfolio";
  const title =
    submission.title ||
    (hasPrompt ? `Submission for "${word}"` : "Portfolio Piece");
  const hasImage = !!submission.imageUrl;
  const hasText = !!submission.text;
  const creatorName = submission.user.name || "Anonymous";

  // If there's an image, try to fetch it and convert to data URL for reliable rendering
  if (hasImage && submission.imageUrl) {
    try {
      // Pre-fetch the image and convert to base64 data URL
      const imageResponse = await fetch(submission.imageUrl);
      if (imageResponse.ok) {
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Get image metadata first (need to rotate to get correct dimensions)
        const rotatedBuffer = await sharp(buffer).rotate().toBuffer();
        const metadata = await sharp(rotatedBuffer).metadata();
        const originalWidth = metadata.width || 1;
        const originalHeight = metadata.height || 1;

        // Get focal point
        const focalPoint = submission.imageFocalPoint as {
          x: number;
          y: number;
        } | null;

        // Target aspect ratio for OG image
        const targetAspectRatio = size.width / size.height; // 1200/630 = ~1.905
        const originalAspectRatio = originalWidth / originalHeight;

        let processedBuffer: Buffer;

        if (focalPoint) {
          // Calculate crop dimensions to match target aspect ratio
          let cropWidth: number;
          let cropHeight: number;

          if (originalAspectRatio > targetAspectRatio) {
            // Original is wider - crop width
            cropHeight = originalHeight;
            cropWidth = cropHeight * targetAspectRatio;
          } else {
            // Original is taller - crop height
            cropWidth = originalWidth;
            cropHeight = cropWidth / targetAspectRatio;
          }

          // Ensure crop doesn't exceed image bounds
          cropWidth = Math.min(cropWidth, originalWidth);
          cropHeight = Math.min(cropHeight, originalHeight);

          // Calculate crop position to center on focal point
          // Focal point is in percentages (0-100), convert to pixels
          const focalX = (focalPoint.x / 100) * originalWidth;
          const focalY = (focalPoint.y / 100) * originalHeight;

          // Position crop so focal point is centered
          let left = focalX - cropWidth / 2;
          let top = focalY - cropHeight / 2;

          // Clamp to image bounds
          left = Math.max(0, Math.min(left, originalWidth - cropWidth));
          top = Math.max(0, Math.min(top, originalHeight - cropHeight));

          // Extract and resize using fresh sharp instance
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
          // No focal point - just resize to cover
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
            {/* Background image cropped with focal point via sharp */}
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
            {/* Overlay with title */}
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
                  {word}
                </span>
                <span style={{ display: "flex", fontSize: "28px" }}>
                  by {creatorName}
                </span>
              </div>
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

  // Text-only version
  const textPreview = hasText ? getFirstSentences(submission.text!, 300) : "";
  const promptWords = hasPrompt
    ? `${submission.prompt!.word1} • ${submission.prompt!.word2} • ${submission.prompt!.word3}`
    : "Portfolio";

  // Debug: log what we have
  console.log(
    "OG Image - hasImage:",
    hasImage,
    "hasText:",
    hasText,
    "textPreview:",
    textPreview?.slice(0, 50),
  );

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
      {/* Left side - Header and metadata */}
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
        {/* Header with prompt words */}
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
            {promptWords}
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

        {/* Footer with word badge */}
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
              {word}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "24px",
                color: "#71717a",
              }}
            >
              by {creatorName}
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

      {/* Right side - Text content (white on black) */}
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
            fontStyle: textPreview ? "normal" : "italic",
          }}
        >
          {textPreview || "Text submission"}
        </div>
      </div>
    </div>,
    { ...size },
  );
}
