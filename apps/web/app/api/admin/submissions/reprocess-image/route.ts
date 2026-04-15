import { NextRequest, NextResponse } from "next/server";
import { processUploadedImage } from "@/app/(app)/workflows/process-uploaded-image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RequestBody {
  submissionId: string;
}

function isLikelyProcessed(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.endsWith(".webp") || lower.endsWith(".gif");
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as Partial<RequestBody>;
  if (!body.submissionId || typeof body.submissionId !== "string") {
    return NextResponse.json(
      { error: "submissionId is required" },
      { status: 400 },
    );
  }

  const submission = await prisma.submission.findUnique({
    where: { id: body.submissionId },
    select: {
      id: true,
      userId: true,
      imageUrl: true,
      imageProcessingMetadata: true,
    },
  });

  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!submission.imageUrl) {
    return NextResponse.json(
      { error: "Submission has no imageUrl" },
      { status: 400 },
    );
  }

  const r2Base = process.env.R2_PUBLIC_URL;
  if (!r2Base || !submission.imageUrl.startsWith(r2Base)) {
    return NextResponse.json(
      { error: "Submission imageUrl is not an R2 URL" },
      { status: 400 },
    );
  }

  const metadata = submission.imageProcessingMetadata as {
    compressed?: boolean;
  } | null;
  const needsProcessing =
    metadata?.compressed !== true || !isLikelyProcessed(submission.imageUrl);

  if (!needsProcessing) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Already processed",
    });
  }

  const result = await processUploadedImage({
    publicUrl: submission.imageUrl,
    type: "submission",
    userId: submission.userId,
    submissionId: submission.id,
  });

  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Processing failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
