import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { getUserImageUrl } from "@/lib/user-image";
import sharp from "sharp";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface RouteParams {
  params: Promise<{ creatorid: string }>;
}

export default async function OpenGraphImage({ params }: RouteParams) {
  const { creatorid } = await params;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ slug: creatorid }, { id: creatorid }],
    },
    select: {
      id: true,
      name: true,
      featuredSubmissionId: true,
      profileImageUrl: true,
      image: true,
      profileImageFocalPoint: true,
    },
  });

  if (!user) {
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
          Profile Not Found
        </div>
      </div>,
      { ...size },
    );
  }

  const userName = user.name || "Anonymous";
  const portfolioTitle = `${userName}'s Portfolio`;

  // Try to fetch featured submission with image
  let featuredImageUrl: string | null = null;
  if (user.featuredSubmissionId) {
    const featuredSubmission = await prisma.submission.findUnique({
      where: { id: user.featuredSubmissionId },
      select: {
        imageUrl: true,
        shareStatus: true,
      },
    });

    // Only use featured image if it's publicly viewable
    if (
      featuredSubmission?.imageUrl &&
      (featuredSubmission.shareStatus === "PROFILE" ||
        featuredSubmission.shareStatus === "PUBLIC")
    ) {
      featuredImageUrl = featuredSubmission.imageUrl;
    }
  }

  // If we have a featured image, use it as background
  if (featuredImageUrl) {
    try {
      const imageResponse = await fetch(featuredImageUrl);
      if (imageResponse.ok) {
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Process image with sharp to auto-rotate based on EXIF orientation
        const processedBuffer = await sharp(buffer)
          .rotate() // Auto-rotate based on EXIF orientation
          .toBuffer();

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
            {/* Background image */}
            <img
              src={imageDataUrl}
              alt={portfolioTitle}
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
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "72px",
                  fontWeight: "bold",
                  color: "#ffffff",
                  lineHeight: "1.2",
                  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                {portfolioTitle}
              </div>
            </div>
          </div>,
          { ...size },
        );
      }
    } catch (error) {
      console.error("Failed to load featured image for OG:", error);
      // Fall through to profile image or grid version
    }
  }

  // If no featured image, try to use profile image
  const profileImage = getUserImageUrl(user.profileImageUrl, user.image);
  if (profileImage) {
    try {
      const imageResponse = await fetch(profileImage);
      if (imageResponse.ok) {
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Get image metadata and process with sharp
        const image = sharp(buffer).rotate(); // Auto-rotate based on EXIF orientation
        const metadata = await image.metadata();
        const originalWidth = metadata.width || 1;
        const originalHeight = metadata.height || 1;

        // Get focal point
        const focalPoint = user.profileImageFocalPoint as {
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

          // Extract and resize
          processedBuffer = await image
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
          processedBuffer = await image
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
            {/* Background image with focal point applied via sharp cropping */}
            <img
              src={imageDataUrl}
              alt={portfolioTitle}
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
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "72px",
                  fontWeight: "bold",
                  color: "#ffffff",
                  lineHeight: "1.2",
                  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                {portfolioTitle}
              </div>
            </div>
          </div>,
          { ...size },
        );
      }
    } catch (error) {
      console.error("Failed to load profile image for OG:", error);
      // Fall through to grid version
    }
  }

  // Otherwise, fetch recent portfolio items/submissions with images for grid
  const recentWork = await prisma.submission.findMany({
    where: {
      userId: user.id,
      imageUrl: { not: null },
      shareStatus: { in: ["PROFILE", "PUBLIC"] },
    },
    select: {
      imageUrl: true,
    },
    orderBy: { createdAt: "desc" },
    take: 9, // 3x3 grid
  });

  // If we have recent work with images, create a grid
  if (recentWork.length > 0) {
    const gridCols = 3;
    const gridRows = Math.ceil(recentWork.length / gridCols);
    const cellWidth = size.width / gridCols;
    const cellHeight = size.height / gridRows;

    // Fetch and convert images to data URLs
    const imageDataUrls: (string | null)[] = await Promise.all(
      recentWork.map(async (item) => {
        if (!item.imageUrl) return null;
        try {
          const imageResponse = await fetch(item.imageUrl);
          if (imageResponse.ok) {
            const arrayBuffer = await imageResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Process image with sharp to auto-rotate based on EXIF orientation
            const processedBuffer = await sharp(buffer)
              .rotate() // Auto-rotate based on EXIF orientation
              .toBuffer();

            const base64 = processedBuffer.toString("base64");
            const contentType =
              imageResponse.headers.get("content-type") || "image/jpeg";
            return `data:${contentType};base64,${base64}`;
          }
        } catch (error) {
          console.error("Failed to load image for grid:", error);
        }
        return null;
      }),
    );

    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          flexWrap: "wrap",
        }}
      >
        {/* Grid of images */}
        {imageDataUrls.map((imageDataUrl, index) => {
          if (!imageDataUrl) return null;
          const row = Math.floor(index / gridCols);
          const col = index % gridCols;
          return (
            <img
              key={index}
              src={imageDataUrl}
              alt={`Work ${index + 1}`}
              width={cellWidth}
              height={cellHeight}
              style={{
                width: `${cellWidth}px`,
                height: `${cellHeight}px`,
                objectFit: "cover",
                position: "absolute",
                left: `${col * cellWidth}px`,
                top: `${row * cellHeight}px`,
              }}
            />
          );
        })}
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
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "72px",
              fontWeight: "bold",
              color: "#ffffff",
              lineHeight: "1.2",
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }}
          >
            {portfolioTitle}
          </div>
        </div>
      </div>,
      { ...size },
    );
  }

  // Fallback: no images available, show simple design
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #ffffff 0%, #f4f4f5 100%)",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <div
        style={{
          fontSize: "72px",
          fontWeight: "bold",
          color: "#000000",
          textAlign: "center",
        }}
      >
        {portfolioTitle}
      </div>
    </div>,
    { ...size },
  );
}
