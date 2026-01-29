import { ImageResponse } from "next/og";
import { fetchImageAsPngDataUrlForOg } from "@/lib/og-image";
import { prisma } from "@/lib/prisma";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface RouteParams {
  params: Promise<{ creatorid: string; collectionid: string }>;
}

export default async function OpenGraphImage({ params }: RouteParams) {
  const { creatorid, collectionid } = await params;

  const collection = await prisma.collection.findUnique({
    where: { id: collectionid },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      submissions: {
        orderBy: { order: "asc" },
        where: {
          submission: {
            imageUrl: { not: null },
            shareStatus: { in: ["PROFILE", "PUBLIC"] },
          },
        },
        include: {
          submission: {
            select: {
              imageUrl: true,
              imageFocalPoint: true,
            },
          },
        },
        take: 9, // 3x3 grid max
      },
      _count: {
        select: { submissions: true },
      },
    },
  });

  // Check if collection exists, belongs to the user, and is public
  // OG images are accessed by crawlers without auth, so we only show public collections
  // Find creator by slug or ID
  const creator = await prisma.user.findFirst({
    where: {
      OR: [{ slug: creatorid }, { id: creatorid }],
    },
    select: { id: true },
  });

  if (
    !collection ||
    !creator ||
    collection.userId !== creator.id ||
    !collection.isPublic
  ) {
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
          Collection Not Found
        </div>
      </div>,
      { ...size },
    );
  }

  const collectionName = collection.name;
  const creatorName = collection.user.name || "Anonymous";
  const itemCount = collection._count.submissions;

  // If we have submissions with images, create a grid
  if (collection.submissions.length > 0) {
    const gridCols = Math.min(3, collection.submissions.length);
    const gridRows = Math.ceil(collection.submissions.length / gridCols);
    const cellWidth = size.width / gridCols;
    const cellHeight = size.height / gridRows;

    const imageDataUrls: (string | null)[] = await Promise.all(
      collection.submissions.map((cs) => {
        if (!cs.submission.imageUrl) return null;
        const focalPoint = cs.submission.imageFocalPoint as {
          x: number;
          y: number;
        } | null;
        return fetchImageAsPngDataUrlForOg(cs.submission.imageUrl!, {
          width: cellWidth,
          height: cellHeight,
          focalPoint: focalPoint ?? undefined,
        });
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
              alt={`Collection item ${index + 1}`}
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
        {/* Overlay with title and metadata */}
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
              fontSize: "72px",
              fontWeight: "bold",
              color: "#ffffff",
              lineHeight: "1.2",
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }}
          >
            {collectionName}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "32px",
              color: "#e4e4e7",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <span>by {creatorName}</span>
            <span style={{ fontSize: "28px" }}>·</span>
            <span>
              {itemCount} {itemCount !== 1 ? "items" : "item"}
            </span>
          </div>
        </div>
      </div>,
      { ...size },
    );
  }

  // Fallback: no images, show simple design
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
        padding: "80px",
      }}
    >
      <div
        style={{
          fontSize: "72px",
          fontWeight: "bold",
          color: "#000000",
          textAlign: "center",
          lineHeight: "1.2",
        }}
      >
        {collectionName}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: "32px",
          color: "#71717a",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <span>by {creatorName}</span>
        <span>·</span>
        <span>
          {itemCount} {itemCount !== 1 ? "items" : "item"}
        </span>
      </div>
    </div>,
    { ...size },
  );
}
