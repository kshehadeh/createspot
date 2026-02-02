import { NextRequest } from "next/server";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripHtml, fetchImageBuffer } from "@/lib/collection-export";

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

  // Create PDF document
  // Use standard fonts that don't require external files
  let doc: PDFKit.PDFDocument;
  try {
    doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });
  } catch (error) {
    console.error("Failed to create PDF document:", error);
    return new Response("Failed to generate PDF", { status: 500 });
  }

  // Collect PDF chunks
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  // Process each submission
  for (let i = 0; i < collection.submissions.length; i++) {
    const { submission } = collection.submissions[i];

    // Add new page for each submission (except first)
    if (i > 0) {
      doc.addPage();
    }

    let yPosition = 50;

    // Add image if present
    if (submission.imageUrl) {
      try {
        const imageBuffer = await fetchImageBuffer(submission.imageUrl);
        const maxWidth = doc.page.width - 100; // Account for margins
        const maxHeight = doc.page.height - 200; // Leave space for title and text

        // Get image dimensions using sharp
        const metadata = await sharp(imageBuffer).metadata();
        const imageWidth = metadata.width || maxWidth;
        const imageHeight = metadata.height || maxHeight;

        // Calculate dimensions to fit while maintaining aspect ratio
        const aspectRatio = imageWidth / imageHeight;
        let finalWidth = maxWidth;
        let finalHeight = maxWidth / aspectRatio;

        if (finalHeight > maxHeight) {
          finalHeight = maxHeight;
          finalWidth = maxHeight * aspectRatio;
        }

        // Calculate x position to center the image horizontally
        const imageX = (doc.page.width - finalWidth) / 2;

        // Add image, centered on page
        doc.image(imageBuffer, imageX, yPosition, {
          fit: [finalWidth, finalHeight],
        });

        yPosition += finalHeight + 20;
      } catch (error) {
        console.error("Failed to load image:", error);
        // Continue without image
      }
    }

    // Add title if present
    if (submission.title) {
      try {
        doc
          .fontSize(18)
          .font("Helvetica-Bold")
          .text(submission.title, 50, yPosition, {
            width: doc.page.width - 100,
            align: "center",
          });
      } catch {
        // Fallback to Times-Roman if Helvetica-Bold fails
        try {
          doc
            .fontSize(18)
            .font("Times-Bold")
            .text(submission.title, 50, yPosition, {
              width: doc.page.width - 100,
              align: "center",
            });
        } catch {
          // Last resort: use default font
          doc.fontSize(18).text(submission.title, 50, yPosition, {
            width: doc.page.width - 100,
            align: "center",
          });
        }
      }
      yPosition += 30;
    }

    // Add text content if present
    if (submission.text) {
      const plainText = stripHtml(submission.text);
      try {
        doc
          .fontSize(12)
          .font("Helvetica")
          .text(plainText, 50, yPosition, {
            width: doc.page.width - 100,
            align: "center",
            lineGap: 5,
          });
      } catch {
        // Fallback to Times-Roman if Helvetica fails
        try {
          doc
            .fontSize(12)
            .font("Times-Roman")
            .text(plainText, 50, yPosition, {
              width: doc.page.width - 100,
              align: "center",
              lineGap: 5,
            });
        } catch {
          // Last resort: use default font
          doc.fontSize(12).text(plainText, 50, yPosition, {
            width: doc.page.width - 100,
            align: "center",
            lineGap: 5,
          });
        }
      }
    }
  }

  // Finalize PDF
  doc.end();

  // Wait for PDF to complete
  await new Promise<void>((resolve) => {
    doc.on("end", resolve);
  });

  // Combine all chunks
  const pdfBuffer = Buffer.concat(chunks);

  // Sanitize filename
  const sanitizedName = collection.name.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `${sanitizedName}.pdf`;

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length.toString(),
    },
  });
}
