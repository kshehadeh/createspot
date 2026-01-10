import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { geocodeLocation } from "@/lib/geocoding";

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
      latitude: true,
      longitude: true,
      featuredSubmissionId: true,
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
  const {
    name,
    bio,
    instagram,
    twitter,
    linkedin,
    website,
    city,
    stateProvince,
    country,
    featuredSubmissionId,
  } = body;

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

  // Geocode location if location fields are provided
  // Check if location fields have changed by getting current user data
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      city: true,
      stateProvince: true,
      country: true,
      latitude: true,
      longitude: true,
    },
  });

  const locationChanged =
    currentUser?.city !== (city ?? null) ||
    currentUser?.stateProvince !== (stateProvince ?? null) ||
    currentUser?.country !== (country ?? null);

  // Prepare update data
  const updateData: {
    name: string | null;
    bio: string | null;
    instagram: string | null;
    twitter: string | null;
    linkedin: string | null;
    website: string | null;
    city: string | null;
    stateProvince: string | null;
    country: string | null;
    latitude?: number | null;
    longitude?: number | null;
    featuredSubmissionId: string | null;
  } = {
    name: name ?? null,
    bio: bio ?? null,
    instagram: instagram ?? null,
    twitter: twitter ?? null,
    linkedin: linkedin ?? null,
    website: website ?? null,
    city: city ?? null,
    stateProvince: stateProvince ?? null,
    country: country ?? null,
    featuredSubmissionId: featuredSubmissionId ?? null,
  };

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
      latitude: true,
      longitude: true,
      featuredSubmissionId: true,
    },
  });

  return NextResponse.json({ user });
}
