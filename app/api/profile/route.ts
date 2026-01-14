import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { geocodeLocation } from "@/lib/geocoding";
import { normalizeUrl, isValidUrl } from "@/lib/utils";
import { isValidLocale } from "@/i18n/config";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function deleteImageFromR2(imageUrl: string): Promise<void> {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl || !imageUrl.startsWith(publicUrl)) return;

  // Extract key, supporting both old format ({userId}/{uuid}.{ext})
  // and new format (submissions/{userId}/{uuid}.{ext} or profiles/{userId}/{uuid}.{ext})
  const key = imageUrl.replace(`${publicUrl}/`, "");
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      }),
    );
  } catch (error) {
    console.error("Failed to delete image from R2:", error);
  }
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      bio: true,
      instagram: true,
      twitter: true,
      linkedin: true,
      website: true,
      city: true,
      stateProvince: true,
      country: true,
      language: true,
      latitude: true,
      longitude: true,
      featuredSubmissionId: true,
      profileImageUrl: true,
      // Image protection settings
      enableWatermark: true,
      watermarkPosition: true,
      protectFromDownload: true,
      protectFromAI: true,
    },
  });

  return NextResponse.json({ user });
}

export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  let {
    name,
    bio,
    instagram,
    twitter,
    linkedin,
    website,
    city,
    stateProvince,
    country,
    language,
    featuredSubmissionId,
    profileImageUrl,
    profileImageFocalPoint,
    // Image protection settings
    enableWatermark,
    watermarkPosition,
    protectFromDownload,
    protectFromAI,
  } = body;

  // Normalize and validate website URL
  if (website && typeof website === "string") {
    const normalized = normalizeUrl(website);
    if (normalized && isValidUrl(normalized)) {
      website = normalized;
    } else if (normalized) {
      // Invalid URL - reject the request
      return NextResponse.json(
        { error: "Invalid website URL" },
        { status: 400 },
      );
    }
  }

  // Validate language if provided
  if (language !== undefined && language !== null) {
    if (typeof language !== "string" || !isValidLocale(language)) {
      return NextResponse.json(
        { error: "Invalid language code" },
        { status: 400 },
      );
    }
  }

  // Validate that featuredSubmissionId belongs to the user if provided
  if (featuredSubmissionId) {
    const submission = await prisma.submission.findUnique({
      where: { id: featuredSubmissionId },
      select: { userId: true },
    });

    if (!submission || submission.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Invalid featured submission" },
        { status: 400 },
      );
    }
  }

  // Validate focal point if provided
  if (profileImageFocalPoint !== undefined && profileImageFocalPoint !== null) {
    if (
      typeof profileImageFocalPoint !== "object" ||
      typeof profileImageFocalPoint.x !== "number" ||
      typeof profileImageFocalPoint.y !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid focal point format. Must be {x: number, y: number}" },
        { status: 400 },
      );
    }

    const { x, y } = profileImageFocalPoint;
    if (x < 0 || x > 100 || y < 0 || y > 100) {
      return NextResponse.json(
        { error: "Focal point coordinates must be between 0 and 100" },
        { status: 400 },
      );
    }
  }

  // Validate watermark position if provided
  const validWatermarkPositions = ["bottom-right", "bottom-left", "top-right", "top-left"];
  if (watermarkPosition !== undefined && watermarkPosition !== null) {
    if (!validWatermarkPositions.includes(watermarkPosition)) {
      return NextResponse.json(
        { error: "Invalid watermark position. Must be one of: bottom-right, bottom-left, top-right, top-left" },
        { status: 400 },
      );
    }
  }

  // Get current user data to check for changes and handle image deletion
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      city: true,
      stateProvince: true,
      country: true,
      latitude: true,
      longitude: true,
      profileImageUrl: true,
    },
  });

  // Delete old profile image from R2 if it's being replaced or removed
  if (
    currentUser?.profileImageUrl &&
    currentUser.profileImageUrl !== (profileImageUrl ?? null)
  ) {
    await deleteImageFromR2(currentUser.profileImageUrl);
  }

  // Check if location fields are being updated
  const locationChanged =
    (city !== undefined && currentUser?.city !== (city ?? null)) ||
    (stateProvince !== undefined &&
      currentUser?.stateProvince !== (stateProvince ?? null)) ||
    (country !== undefined && currentUser?.country !== (country ?? null));

  // Prepare update data - only include fields that are explicitly provided
  const updateData: Record<string, unknown> = {};

  // Only include fields that are explicitly provided in the request
  if (name !== undefined) updateData.name = name ?? null;
  if (bio !== undefined) updateData.bio = bio ?? null;
  if (instagram !== undefined) updateData.instagram = instagram ?? null;
  if (twitter !== undefined) updateData.twitter = twitter ?? null;
  if (linkedin !== undefined) updateData.linkedin = linkedin ?? null;
  if (website !== undefined) updateData.website = website ?? null;
  if (city !== undefined) updateData.city = city ?? null;
  if (stateProvince !== undefined)
    updateData.stateProvince = stateProvince ?? null;
  if (country !== undefined) updateData.country = country ?? null;
  if (language !== undefined) updateData.language = language ?? "en";
  if (featuredSubmissionId !== undefined)
    updateData.featuredSubmissionId = featuredSubmissionId ?? null;
  if (profileImageUrl !== undefined)
    updateData.profileImageUrl = profileImageUrl ?? null;
  if (profileImageFocalPoint !== undefined)
    updateData.profileImageFocalPoint = profileImageFocalPoint;
  // Image protection settings
  if (enableWatermark !== undefined)
    updateData.enableWatermark = enableWatermark ?? false;
  if (watermarkPosition !== undefined)
    updateData.watermarkPosition = watermarkPosition ?? "bottom-right";
  if (protectFromDownload !== undefined)
    updateData.protectFromDownload = protectFromDownload ?? true;
  if (protectFromAI !== undefined)
    updateData.protectFromAI = protectFromAI ?? true;

  // Handle coordinates: only update if location changed
  if (locationChanged) {
    if (city || stateProvince || country) {
      // Try to geocode the new location
      const coords = await geocodeLocation(city, stateProvince, country);
      updateData.latitude = coords ? coords.lat : null;
      updateData.longitude = coords ? coords.lng : null;
    } else {
      // Location fields cleared, clear coordinates too
      updateData.latitude = null;
      updateData.longitude = null;
    }
  }
  // If location hasn't changed, don't include latitude/longitude in update
  // This preserves existing coordinates

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      bio: true,
      instagram: true,
      twitter: true,
      linkedin: true,
      website: true,
      city: true,
      stateProvince: true,
      country: true,
      language: true,
      latitude: true,
      longitude: true,
      featuredSubmissionId: true,
      profileImageUrl: true,
      // Image protection settings
      enableWatermark: true,
      watermarkPosition: true,
      protectFromDownload: true,
      protectFromAI: true,
    },
  });

  // Create response
  const response = NextResponse.json({ user });

  // Set locale cookie if language was updated
  if (language !== undefined) {
    response.cookies.set("NEXT_LOCALE", user.language, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
  }

  return response;
}
