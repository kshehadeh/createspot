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

  // Fetch collection with submissions
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
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

  // Only owner can download
  if (collection.userId !== session.user.id) {
    return new Response("Unauthorized", { status: 403 });
  }

  // Create ZIP archive
  const archive = archiver("zip", {
    zlib: { level: 9 }, // Maximum compression
  });

  // Collect ZIP chunks
  const chunks: Buffer[] = [];
  archive.on("data", (chunk: Buffer) => {
    chunks.push(chunk);
  });

  // Process each submission
  for (let i = 0; i < collection.submissions.length; i++) {
    const { submission } = collection.submissions[i];
    const index = i + 1;
    const indexStr = index.toString().padStart(2, "0");

    // Create folder name: "01 - Title" or "01" if no title
    const folderName = submission.title
      ? `${indexStr} - ${sanitizeFilename(submission.title)}`
      : indexStr;

    // Add image if present
    if (submission.imageUrl) {
      try {
        const imageBuffer = await fetchImageBuffer(submission.imageUrl);
        const extension = getImageExtension(submission.imageUrl);
        const imageFileName = `image.${extension}`;
        archive.append(imageBuffer, {
          name: `${folderName}/${imageFileName}`,
        });
      } catch (error) {
        console.error("Failed to load image:", error);
        // Continue without image
      }
    }

    // Create metadata.md
    const metadataLines: string[] = [];
    metadataLines.push(`# ${submission.title || "Untitled"}`);
    metadataLines.push("");

    if (collection.description) {
      metadataLines.push(collection.description);
      metadataLines.push("");
    }

    if (submission.text) {
      const plainText = stripHtml(submission.text);
      metadataLines.push(plainText);
    }

    archive.append(metadataLines.join("\n"), {
      name: `${folderName}/metadata.md`,
    });

    // Create text.md if submission has text content
    if (submission.text) {
      const plainText = stripHtml(submission.text);
      const textMdLines: string[] = [];

      // Add title as h1 if present
      if (submission.title) {
        textMdLines.push(`# ${submission.title}`);
        textMdLines.push("");
      }

      textMdLines.push(plainText);

      archive.append(textMdLines.join("\n"), {
        name: `${folderName}/text.md`,
      });
    }
  }

  // Finalize archive
  archive.finalize();

  // Wait for archive to complete
  await new Promise<void>((resolve, reject) => {
    archive.on("end", () => resolve());
    archive.on("error", (err) => reject(err));
  });

  // Combine all chunks
  const zipBuffer = Buffer.concat(chunks);

  // Sanitize filename
  const sanitizedName = collection.name.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `${sanitizedName}.zip`;

  return new Response(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": zipBuffer.length.toString(),
    },
  });
}
