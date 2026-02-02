import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  fetchImageBuffer,
  sanitizeFilename,
  getImageExtension,
} from "@/lib/collection-export";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: { userId: true, imageUrl: true, title: true },
  });

  if (!submission) {
    return new Response("Submission not found", { status: 404 });
  }

  if (submission.userId !== session.user.id) {
    return new Response("Unauthorized", { status: 403 });
  }

  if (!submission.imageUrl) {
    return new Response("Submission has no image", { status: 404 });
  }

  const imageBuffer = await fetchImageBuffer(submission.imageUrl);
  const extension = getImageExtension(submission.imageUrl);
  const baseName = submission.title ? sanitizeFilename(submission.title) : id;
  const filename = `${baseName}.${extension}`;

  const contentType =
    extension === "webp"
      ? "image/webp"
      : extension === "png"
        ? "image/png"
        : "image/jpeg";

  return new Response(new Uint8Array(imageBuffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": imageBuffer.length.toString(),
    },
  });
}
