import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import {
  createOgGridImageResponse,
  createOgNotFoundResponse,
  fetchImageAsPngDataUrlForOg,
  OG_IMAGE_CONTENT_TYPE as contentType,
  OG_IMAGE_SIZE as size,
} from "@/lib/og-image";

export { size, contentType };

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
    return createOgNotFoundResponse("Collection Not Found");
  }

  const collectionName = collection.name;
  const creatorName = collection.user.name || "Anonymous";
  const itemCount = collection._count.submissions;

  // If we have submissions with images, create a grid
  if (collection.submissions.length > 0) {
    const gridCols = Math.min(3, collection.submissions.length);
    const cellWidth = size.width / gridCols;
    const cellHeight =
      size.height / Math.ceil(collection.submissions.length / gridCols);

    const imageDataUrls: (string | null)[] = await Promise.all(
      collection.submissions.map((cs) => {
        if (!cs.submission.imageUrl) return null;
        const focalPoint = cs.submission.imageFocalPoint as {
          x: number;
          y: number;
        } | null;
        return fetchImageAsPngDataUrlForOg(cs.submission.imageUrl, {
          width: cellWidth,
          height: cellHeight,
          focalPoint: focalPoint ?? undefined,
        });
      }),
    );

    return createOgGridImageResponse(imageDataUrls);
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
