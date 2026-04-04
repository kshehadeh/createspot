import { NextRequest } from "next/server";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { fetchImageBuffer, stripHtml } from "@/lib/collection-export";
import { prisma } from "@/lib/prisma";

const PAGE_MARGIN = 50;
const CONTENT_WIDTH = 612 - PAGE_MARGIN * 2;
const CONTENT_HEIGHT = 792 - PAGE_MARGIN * 2;
const SECTION_GAP = 16;

interface PdfImageData {
  buffer: Buffer;
  width: number;
  height: number;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

function setDocumentFont(doc: PDFKit.PDFDocument, variant: "regular" | "bold") {
  const fontNames =
    variant === "bold"
      ? ["Helvetica-Bold", "Times-Bold"]
      : ["Helvetica", "Times-Roman"];

  for (const fontName of fontNames) {
    try {
      doc.font(fontName);
      return;
    } catch {
      continue;
    }
  }
}

function getFittedDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
) {
  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, 1);
  const aspectRatio = safeWidth / safeHeight;

  let finalWidth = maxWidth;
  let finalHeight = finalWidth / aspectRatio;

  if (finalHeight > maxHeight) {
    finalHeight = maxHeight;
    finalWidth = finalHeight * aspectRatio;
  }

  return {
    width: finalWidth,
    height: finalHeight,
  };
}

function truncateTextToFit(
  doc: PDFKit.PDFDocument,
  text: string,
  width: number,
  maxHeight: number,
) {
  const normalizedText = text.trim();

  if (!normalizedText || maxHeight <= 0) {
    return "";
  }

  if (doc.heightOfString(normalizedText, { width }) <= maxHeight) {
    return normalizedText;
  }

  const words = normalizedText.split(/\s+/);
  let low = 0;
  let high = words.length;
  let bestFit = "";

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = `${words.slice(0, mid).join(" ")}...`.trim();

    if (!candidate) {
      low = mid + 1;
      continue;
    }

    if (doc.heightOfString(candidate, { width }) <= maxHeight) {
      bestFit = candidate;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return bestFit;
}

async function getPdfImageData(imageUrl: string): Promise<PdfImageData> {
  const imageBuffer = await fetchImageBuffer(imageUrl);
  const pngBuffer = await sharp(imageBuffer).png().toBuffer();
  const metadata = await sharp(pngBuffer).metadata();

  return {
    buffer: pngBuffer,
    width: metadata.width || CONTENT_WIDTH,
    height: metadata.height || CONTENT_HEIGHT,
  };
}

function drawHeading(doc: PDFKit.PDFDocument, text: string, y: number) {
  doc.fontSize(20);
  setDocumentFont(doc, "bold");
  const height = doc.heightOfString(text, {
    width: CONTENT_WIDTH,
    align: "center",
  });

  doc.text(text, PAGE_MARGIN, y, {
    width: CONTENT_WIDTH,
    align: "center",
  });

  return height;
}

function drawBodyText(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number,
  align: "left" | "center",
) {
  doc.fontSize(12);
  setDocumentFont(doc, "regular");
  doc.text(text, x, y, {
    width,
    align,
    lineGap: 5,
  });
}

async function drawImagePage(
  doc: PDFKit.PDFDocument,
  heading: string,
  imageUrl: string,
) {
  doc.addPage();

  let yPosition = PAGE_MARGIN;
  yPosition += drawHeading(doc, heading, yPosition) + SECTION_GAP;

  const image = await getPdfImageData(imageUrl);
  const maxHeight = doc.page.height - PAGE_MARGIN - yPosition;
  const { width, height } = getFittedDimensions(
    image.width,
    image.height,
    CONTENT_WIDTH,
    maxHeight,
  );

  doc.image(
    image.buffer,
    PAGE_MARGIN + (CONTENT_WIDTH - width) / 2,
    yPosition,
    {
      fit: [width, height],
    },
  );
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      progressions: {
        orderBy: { order: "asc" },
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

  let yPosition = PAGE_MARGIN;

  if (submission.title) {
    doc.fontSize(18);
    setDocumentFont(doc, "bold");
    const titleHeight = doc.heightOfString(submission.title, {
      width: CONTENT_WIDTH,
      align: "center",
    });

    doc.text(submission.title, PAGE_MARGIN, yPosition, {
      width: CONTENT_WIDTH,
      align: "center",
    });

    yPosition += titleHeight + SECTION_GAP;
  }

  const plainText = submission.text ? stripHtml(submission.text) : "";
  let renderedText = "";

  if (plainText) {
    doc.fontSize(12);
    setDocumentFont(doc, "regular");
    renderedText = truncateTextToFit(doc, plainText, CONTENT_WIDTH, 140);
  }

  const reservedTextHeight = renderedText
    ? doc.heightOfString(renderedText, {
        width: CONTENT_WIDTH,
        align: "center",
        lineGap: 5,
      }) + SECTION_GAP
    : 0;

  if (submission.imageUrl) {
    try {
      const image = await getPdfImageData(submission.imageUrl);
      const maxHeight = Math.max(
        doc.page.height - PAGE_MARGIN - yPosition - reservedTextHeight,
        120,
      );
      const { width, height } = getFittedDimensions(
        image.width,
        image.height,
        CONTENT_WIDTH,
        maxHeight,
      );

      doc.image(
        image.buffer,
        PAGE_MARGIN + (CONTENT_WIDTH - width) / 2,
        yPosition,
        {
          fit: [width, height],
        },
      );

      yPosition += height + SECTION_GAP;
    } catch (error) {
      console.error("Failed to load image:", error);
    }
  }

  if (renderedText) {
    drawBodyText(
      doc,
      renderedText,
      PAGE_MARGIN,
      yPosition,
      CONTENT_WIDTH,
      "center",
    );
  }

  if (submission.referenceImageUrl) {
    try {
      await drawImagePage(doc, "Reference", submission.referenceImageUrl);
    } catch (error) {
      console.error("Failed to load reference image:", error);
    }
  }

  if (submission.progressions.length > 0) {
    doc.addPage();

    let progressionY = PAGE_MARGIN;
    progressionY +=
      drawHeading(doc, "Progressions", progressionY) + SECTION_GAP;

    const columns = submission.progressions.length <= 4 ? 2 : 3;
    const rows = Math.ceil(submission.progressions.length / columns);
    const gutter = 12;
    const availableHeight = doc.page.height - PAGE_MARGIN - progressionY;
    const cellWidth = (CONTENT_WIDTH - gutter * (columns - 1)) / columns;
    const cellHeight = (availableHeight - gutter * (rows - 1)) / rows;

    for (const [index, progression] of submission.progressions.entries()) {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const cellX = PAGE_MARGIN + column * (cellWidth + gutter);
      const cellY = progressionY + row * (cellHeight + gutter);
      let cellContentY = cellY;

      doc
        .rect(cellX, cellY, cellWidth, cellHeight)
        .strokeColor("#d4d4d8")
        .stroke();

      doc.fontSize(11);
      setDocumentFont(doc, "bold");
      const stepLabel = `Step ${progression.order + 1}`;
      const labelHeight = doc.heightOfString(stepLabel, {
        width: cellWidth - 16,
      });
      doc.text(stepLabel, cellX + 8, cellContentY + 8, {
        width: cellWidth - 16,
        align: "left",
      });
      cellContentY += labelHeight + 16;

      const progressionText = [progression.text, progression.comment]
        .filter(Boolean)
        .map((value) => stripHtml(value || ""))
        .filter(Boolean)
        .join("\n\n");

      const remainingHeight = cellHeight - (cellContentY - cellY) - 8;

      if (progression.imageUrl) {
        try {
          const image = await getPdfImageData(progression.imageUrl);
          const imageMaxHeight = progressionText
            ? Math.max(remainingHeight * 0.58, 50)
            : remainingHeight;
          const { width, height } = getFittedDimensions(
            image.width,
            image.height,
            cellWidth - 16,
            imageMaxHeight,
          );

          doc.image(
            image.buffer,
            cellX + 8 + (cellWidth - 16 - width) / 2,
            cellContentY,
            {
              fit: [width, height],
            },
          );

          cellContentY += height + 8;
        } catch (error) {
          console.error(
            `Failed to load progression ${progression.order + 1} image:`,
            error,
          );
        }
      }

      if (progressionText) {
        doc.fontSize(9);
        setDocumentFont(doc, "regular");
        const textHeight = cellHeight - (cellContentY - cellY) - 8;
        const truncatedText = truncateTextToFit(
          doc,
          progressionText,
          cellWidth - 16,
          textHeight,
        );

        if (truncatedText) {
          doc.text(truncatedText, cellX + 8, cellContentY, {
            width: cellWidth - 16,
            height: textHeight,
            align: "left",
            lineGap: 2,
          });
        }
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
