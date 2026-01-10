import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const exhibitId = searchParams.get("exhibitId");

  // Build where clause
  const whereClause: {
    latitude: { not: null };
    longitude: { not: null };
    submissions?: {
      some: {
        exhibitSubmissions: {
          some: {
            exhibitId: string;
          };
        };
      };
    };
  } = {
    latitude: { not: null },
    longitude: { not: null },
  };

  // If exhibitId is provided, filter to only users with submissions in that exhibit
  if (exhibitId) {
    whereClause.submissions = {
      some: {
        exhibitSubmissions: {
          some: {
            exhibitId,
          },
        },
      },
    };
  }

  // Fetch users with valid coordinates
  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      image: true,
      city: true,
      stateProvince: true,
      country: true,
      latitude: true,
      longitude: true,
    },
  });

  // Filter out any users with null coordinates (TypeScript safety)
  const usersWithCoords = users.filter(
    (user): user is typeof user & { latitude: number; longitude: number } =>
      user.latitude !== null && user.longitude !== null,
  );

  return NextResponse.json({ users: usersWithCoords });
}
