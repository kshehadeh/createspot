import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface RouteParams {
  params: Promise<{ id: string }>;
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
  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
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
          name: true,
        },
      },
    },
  });

  if (!submission) {
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
        const base64 = Buffer.from(arrayBuffer).toString("base64");
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
            {/* Background image with explicit dimensions */}
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
            Prompts
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
