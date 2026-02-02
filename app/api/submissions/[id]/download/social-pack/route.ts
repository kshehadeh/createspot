import { NextRequest } from "next/server";
import archiver from "archiver";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchImageBuffer, sanitizeFilename } from "@/lib/collection-export";
import {
  generateSocialVariants,
  buildCaptionText,
  SOCIAL_PLATFORM_PRESETS,
} from "@/lib/social-pack";

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
    include: {
      user: {
        select: { id: true, name: true, slug: true },
      },
      prompt: {
        select: {
          word1: true,
          word2: true,
          word3: true,
        },
      },
    },
  });

  if (!submission) {
    return new Response("Submission not found", { status: 404 });
  }

  if (submission.userId !== session.user.id) {
    return new Response("Unauthorized", { status: 403 });
  }

  const baseUrl =
    process.env.NEXTAUTH_URL ||
    (request.headers.get("x-forwarded-proto") &&
    request.headers.get("x-forwarded-host")
      ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("x-forwarded-host")}`
      : null) ||
    "http://localhost:3000";

  const archive = archiver("zip", { zlib: { level: 9 } });
  const chunks: Buffer[] = [];
  archive.on("data", (chunk: Buffer) => chunks.push(chunk));

  const creator = {
    name: submission.user.name,
    slug: submission.user.slug,
    id: submission.user.id,
  };

  const folderName = submission.title
    ? sanitizeFilename(submission.title)
    : "01";

  if (submission.imageUrl) {
    try {
      const imageBuffer = await fetchImageBuffer(submission.imageUrl);
      const focalPoint = submission.imageFocalPoint as
        | { x: number; y: number }
        | null
        | undefined;
      const variants = await generateSocialVariants(imageBuffer, focalPoint);

      for (const preset of SOCIAL_PLATFORM_PRESETS) {
        const buffer = variants.get(preset.id);
        if (buffer) {
          archive.append(buffer, {
            name: `${folderName}/${preset.id}.jpg`,
          });
        }
      }
    } catch (error) {
      console.error("Failed to load image for social pack:", error);
    }
  }

  const captionText = buildCaptionText(
    {
      title: submission.title,
      text: submission.text,
      prompt: submission.prompt ?? undefined,
    },
    creator,
    submission.id,
    baseUrl,
  );
  archive.append(captionText, {
    name: `${folderName}/caption.txt`,
  });

  archive.finalize();

  await new Promise<void>((resolve, reject) => {
    archive.on("end", () => resolve());
    archive.on("error", (err) => reject(err));
  });

  const zipBuffer = Buffer.concat(chunks);
  const safeName = (submission.title || id).replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `${safeName}_social_pack.zip`;

  return new Response(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": zipBuffer.length.toString(),
    },
  });
}
