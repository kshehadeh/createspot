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

  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  let yPosition = 50;

  if (submission.imageUrl) {
    try {
      const imageBuffer = await fetchImageBuffer(submission.imageUrl);
      const maxWidth = doc.page.width - 100;
      const maxHeight = doc.page.height - 200;
      const metadata = await sharp(imageBuffer).metadata();
      const imageWidth = metadata.width || maxWidth;
      const imageHeight = metadata.height || maxHeight;
      const aspectRatio = imageWidth / imageHeight;
      let finalWidth = maxWidth;
      let finalHeight = maxWidth / aspectRatio;
      if (finalHeight > maxHeight) {
        finalHeight = maxHeight;
        finalWidth = maxHeight * aspectRatio;
      }
      const imageX = (doc.page.width - finalWidth) / 2;
      doc.image(imageBuffer, imageX, yPosition, {
        fit: [finalWidth, finalHeight],
      });
      yPosition += finalHeight + 20;
    } catch (error) {
      console.error("Failed to load image:", error);
    }
  }

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
      try {
        doc
          .fontSize(18)
          .font("Times-Bold")
          .text(submission.title, 50, yPosition, {
            width: doc.page.width - 100,
            align: "center",
          });
      } catch {
        doc.fontSize(18).text(submission.title, 50, yPosition, {
          width: doc.page.width - 100,
          align: "center",
        });
      }
    }
    yPosition += 30;
  }

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
        doc.fontSize(12).text(plainText, 50, yPosition, {
          width: doc.page.width - 100,
          align: "center",
          lineGap: 5,
        });
      }
    }
  }

  doc.end();

  await new Promise<void>((resolve) => {
    doc.on("end", resolve);
  });

  const pdfBuffer = Buffer.concat(chunks);
  const safeName = (submission.title || id).replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `${safeName}.pdf`;

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length.toString(),
    },
  });
}
