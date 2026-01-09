import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  // Fetch all users with valid coordinates
  const users = await prisma.user.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
    },
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
