import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { getUserImageUrl } from "@/lib/user-image";
import {
  canShowSubmissionForOg,
  createOgFullBleedImageResponse,
  createOgGridImageResponse,
  createOgNotFoundResponse,
  fetchImageAsPngDataUrl,
  fetchImageAsPngDataUrlForOg,
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
      featuredSubmissionId: true,
      profileImageUrl: true,
      image: true,
      profileImageFocalPoint: true,
    },
  });

  if (!user) {
    return createOgNotFoundResponse("Profile Not Found");
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
        userId: true,
      },
    });

    if (
      canShowSubmissionForOg(featuredSubmission, user.id) &&
      featuredSubmission.imageUrl
    ) {
      featuredImageUrl = featuredSubmission.imageUrl;
    }
  }

  if (featuredImageUrl) {
    const imageDataUrl = await fetchImageAsPngDataUrl(featuredImageUrl);
    if (imageDataUrl) {
      return createOgFullBleedImageResponse(imageDataUrl, portfolioTitle);
    }
  }

  // If no featured image, try to use profile image
  const profileImage = getUserImageUrl(user.profileImageUrl, user.image);
  if (profileImage) {
    const focalPoint = user.profileImageFocalPoint as {
      x: number;
      y: number;
    } | null;
    const imageDataUrl = await fetchImageAsPngDataUrlForOg(profileImage, {
      width: size.width,
      height: size.height,
      focalPoint: focalPoint ?? undefined,
    });
    if (imageDataUrl) {
      return createOgFullBleedImageResponse(imageDataUrl, portfolioTitle);
    }
  }

  // Otherwise, fetch recent portfolio items/submissions with images for grid
  // Same visibility as single-submission OG: PUBLIC, PROFILE, or owner's PRIVATE
  const recentWork = await prisma.submission.findMany({
    where: {
      userId: user.id,
      imageUrl: { not: null },
      shareStatus: { in: ["PROFILE", "PUBLIC", "PRIVATE"] },
    },
    select: {
      imageUrl: true,
    },
    orderBy: { createdAt: "desc" },
    take: 9, // 3x3 grid
  });

  // If we have recent work with images, create a grid
  if (recentWork.length > 0) {
    const imageDataUrls: (string | null)[] = await Promise.all(
      recentWork.map((item) =>
        item.imageUrl ? fetchImageAsPngDataUrl(item.imageUrl) : null,
      ),
    );
    return createOgGridImageResponse(imageDataUrls);
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
