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

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, slug: true },
      },
      submissions: {
        orderBy: { order: "asc" },
        include: {
          submission: {
            include: {
              prompt: {
                select: {
                  word1: true,
                  word2: true,
                  word3: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!collection) {
    return new Response("Collection not found", { status: 404 });
  }

  if (collection.userId !== session.user.id) {
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
    name: collection.user.name,
    slug: collection.user.slug,
    id: collection.user.id,
  };

  for (let i = 0; i < collection.submissions.length; i++) {
    const { submission } = collection.submissions[i];
    const index = i + 1;
    const indexStr = index.toString().padStart(2, "0");
    const folderName = submission.title
      ? `${indexStr} - ${sanitizeFilename(submission.title)}`
      : indexStr;

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
  }

  archive.finalize();

  await new Promise<void>((resolve, reject) => {
    archive.on("end", () => resolve());
    archive.on("error", (err) => reject(err));
  });

  const zipBuffer = Buffer.concat(chunks);
  const sanitizedName = collection.name.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `${sanitizedName}_social_pack.zip`;

  return new Response(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": zipBuffer.length.toString(),
    },
  });
}
