import { ImageResponse } from "next/og";
import { fetchImageAsPngDataUrl } from "@/lib/og-image";
import { prisma } from "@/lib/prisma";

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
          Portfolio Not Found
        </div>
      </div>,
      { ...size },
    );
  }

  const userName = user.name || "Anonymous";
  const portfolioTitle = `${userName}'s Portfolio`;

  // Fetch portfolio items with images
  const portfolioItems = await prisma.submission.findMany({
    where: {
      userId: user.id,
      isPortfolio: true,
      imageUrl: { not: null },
      shareStatus: { in: ["PROFILE", "PUBLIC"] },
    },
    select: {
      imageUrl: true,
    },
    orderBy: [{ portfolioOrder: "asc" }, { createdAt: "desc" }],
    take: 9, // 3x3 grid
  });

  // If we have portfolio items with images, create a grid
  if (portfolioItems.length > 0) {
    const gridCols = Math.min(3, portfolioItems.length);
    const gridRows = Math.ceil(portfolioItems.length / gridCols);
    const cellWidth = size.width / gridCols;
    const cellHeight = size.height / gridRows;

    const imageDataUrls: (string | null)[] = await Promise.all(
      portfolioItems.map((item) =>
        item.imageUrl ? fetchImageAsPngDataUrl(item.imageUrl) : null,
      ),
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
              alt={`Portfolio item ${index + 1}`}
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

  // Fallback: no portfolio items, show simple design
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
