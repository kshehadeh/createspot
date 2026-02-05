import { NextRequest } from "next/server";
import sharp from "sharp";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchImageBuffer, sanitizeFilename } from "@/lib/collection-export";

const FRAME_DELAY_MS = 1000;

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getRawRgba(
  imageBuffer: Buffer,
  targetWidth: number,
  targetHeight: number,
): Promise<{ data: Uint8Array; width: number; height: number }> {
  const { data, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .resize(targetWidth, targetHeight, { fit: "cover", position: "center" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data: new Uint8Array(data),
    width: info.width,
    height: info.height,
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      userId: true,
      title: true,
      imageUrl: true,
      progressions: {
        orderBy: { order: "asc" },
        select: { imageUrl: true },
      },
    },
  });

  if (!submission) {
    return new Response("Submission not found", { status: 404 });
  }

  if (submission.userId !== session.user.id) {
    return new Response("Unauthorized", { status: 403 });
  }

  const progressionImages = submission.progressions.filter(
    (p): p is { imageUrl: string } => p.imageUrl != null,
  );

  if (progressionImages.length < 2) {
    return new Response(
      JSON.stringify({
        error: "At least 2 progression images are required to create a GIF",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const buffers: Buffer[] = [];
  for (const p of progressionImages) {
    try {
      buffers.push(await fetchImageBuffer(p.imageUrl));
    } catch (error) {
      console.error("Failed to fetch progression image:", error);
      return new Response("Failed to load progression image", { status: 500 });
    }
  }

  if (submission.imageUrl) {
    try {
      buffers.push(await fetchImageBuffer(submission.imageUrl));
    } catch (error) {
      console.error("Failed to fetch submission image:", error);
      return new Response("Failed to load final image", { status: 500 });
    }
  }

  const first = await getRawRgba(buffers[0], 800, 600);
  const width = first.width;
  const height = first.height;

  const gif = GIFEncoder();

  for (let i = 0; i < buffers.length; i++) {
    const { data } =
      i === 0 ? first : await getRawRgba(buffers[i], width, height);
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, width, height, {
      palette,
      delay: FRAME_DELAY_MS,
    });
  }

  gif.finish();
  const bytes = gif.bytes();
  const buffer = Buffer.from(bytes);

  const baseName = submission.title ? sanitizeFilename(submission.title) : id;
  const filename = `${baseName}_progressions.gif`;

  return new Response(buffer, {
    headers: {
      "Content-Type": "image/gif",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": bytes.length.toString(),
    },
  });
}
