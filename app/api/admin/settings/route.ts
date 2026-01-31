import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getSiteSettings,
  updateSiteSettings,
  type HomepageCarouselFallback,
} from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getSiteSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    homepageCarouselExhibitId?: string | null;
    homepageCarouselFallback?: HomepageCarouselFallback;
    homepageHeroSubmissionId?: string | null;
  };

  if (
    body.homepageCarouselFallback &&
    body.homepageCarouselFallback !== "latest" &&
    body.homepageCarouselFallback !== "hero"
  ) {
    return NextResponse.json({ error: "Invalid fallback" }, { status: 400 });
  }

  if (body.homepageCarouselExhibitId) {
    const exists = await prisma.exhibit.findUnique({
      where: { id: body.homepageCarouselExhibitId },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "Exhibit not found" }, { status: 400 });
    }
  }

  if (body.homepageHeroSubmissionId) {
    const exists = await prisma.submission.findUnique({
      where: { id: body.homepageHeroSubmissionId },
      select: { id: true, shareStatus: true, imageUrl: true },
    });
    if (!exists || exists.shareStatus !== "PUBLIC" || !exists.imageUrl) {
      return NextResponse.json(
        { error: "Invalid hero submission" },
        { status: 400 },
      );
    }
  }

  const settings = await updateSiteSettings({
    homepageCarouselExhibitId: body.homepageCarouselExhibitId ?? undefined,
    homepageCarouselFallback: body.homepageCarouselFallback ?? undefined,
    homepageHeroSubmissionId: body.homepageHeroSubmissionId ?? undefined,
  });

  return NextResponse.json({ settings });
}
