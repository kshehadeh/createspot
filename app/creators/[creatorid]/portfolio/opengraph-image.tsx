import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import {
  createOgGridImageResponse,
  createOgNotFoundResponse,
  fetchImageAsPngDataUrl,
  OG_IMAGE_CONTENT_TYPE as contentType,
  OG_IMAGE_SIZE as size,
} from "@/lib/og-image";

export { size, contentType };

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
    return createOgNotFoundResponse("Portfolio Not Found");
  }

  const userName = user.name || "Anonymous";
  const portfolioTitle = `${userName}'s Portfolio`;

  // Fetch portfolio items with images (same visibility as single-submission OG)
  const portfolioItems = await prisma.submission.findMany({
    where: {
      userId: user.id,
      isPortfolio: true,
      imageUrl: { not: null },
      shareStatus: { in: ["PROFILE", "PUBLIC", "PRIVATE"] },
    },
    select: {
      imageUrl: true,
    },
    orderBy: [{ portfolioOrder: "asc" }, { createdAt: "desc" }],
    take: 9, // 3x3 grid
  });

  // If we have portfolio items with images, create a grid
  if (portfolioItems.length > 0) {
    const imageDataUrls: (string | null)[] = await Promise.all(
      portfolioItems.map((item) =>
        item.imageUrl ? fetchImageAsPngDataUrl(item.imageUrl) : null,
      ),
    );
    return createOgGridImageResponse(imageDataUrls);
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
