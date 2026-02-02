import { NextRequest } from "next/server";
import archiver from "archiver";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  stripHtml,
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
    include: {
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

  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  const chunks: Buffer[] = [];
  archive.on("data", (chunk: Buffer) => chunks.push(chunk));

  const folderName = submission.title
    ? sanitizeFilename(submission.title)
    : "01";

  if (submission.imageUrl) {
    try {
      const imageBuffer = await fetchImageBuffer(submission.imageUrl);
      const extension = getImageExtension(submission.imageUrl);
      archive.append(imageBuffer, {
        name: `${folderName}/image.${extension}`,
      });
    } catch (error) {
      console.error("Failed to load image:", error);
    }
  }

  const metadataLines: string[] = [];
  metadataLines.push(`# ${submission.title || "Untitled"}`);
  metadataLines.push("");
  if (submission.text) {
    metadataLines.push(stripHtml(submission.text));
  }
  archive.append(metadataLines.join("\n"), {
    name: `${folderName}/metadata.md`,
  });

  if (submission.text) {
    const textMdLines: string[] = [];
    if (submission.title) {
      textMdLines.push(`# ${submission.title}`);
      textMdLines.push("");
    }
    textMdLines.push(stripHtml(submission.text));
    archive.append(textMdLines.join("\n"), {
      name: `${folderName}/text.md`,
    });
  }

  archive.finalize();

  await new Promise<void>((resolve, reject) => {
    archive.on("end", () => resolve());
    archive.on("error", (err) => reject(err));
  });

  const zipBuffer = Buffer.concat(chunks);
  const safeName = (submission.title || id).replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `${safeName}.zip`;

  return new Response(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": zipBuffer.length.toString(),
    },
  });
}
