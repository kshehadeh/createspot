import { generateText } from "ai";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const DEFAULT_AUTOFIX_MODEL = "google/gemini-3.1-flash-image-preview";
const AUTOFIX_TIMEOUT_MS = 120_000;

const restorationPrompt = `Restore this artwork/document photo while preserving authenticity.

Goals:
- Remove uneven lighting and unwanted cast shadows.
- Neutralize yellow/amber color cast and restore accurate whites.
- Improve exposure and local contrast gently for readability.
- Preserve original paper/canvas texture, brush strokes, and fine detail.

Constraints:
- Do not crop, rotate, or change aspect ratio.
- Do not add new content, text, borders, or watermark.
- Avoid over-smoothing and avoid over-saturation.
- Keep the result natural and faithful to the source.`;

export async function POST(
  request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      imageUrl: true,
    },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  }

  if (submission.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!submission.imageUrl) {
    return NextResponse.json(
      { error: "Submission has no image" },
      { status: 400 },
    );
  }

  const model = process.env.IMAGE_EDITOR_AUTOFIX_MODEL || DEFAULT_AUTOFIX_MODEL;
  const requestBody = await request
    .json()
    .catch(() => ({ sourceImageUrl: undefined }));
  const sourceImageUrl =
    typeof requestBody?.sourceImageUrl === "string" &&
    requestBody.sourceImageUrl.length > 0
      ? requestBody.sourceImageUrl
      : submission.imageUrl;

  try {
    const result = await generateText({
      model,
      abortSignal: AbortSignal.timeout(AUTOFIX_TIMEOUT_MS),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: restorationPrompt },
            {
              type: "image",
              image: sourceImageUrl,
            },
          ],
        },
      ],
      providerOptions: {
        gateway: {
          user: session.user.id,
          tags: ["feature:image-editor", "action:auto-fix"],
        },
      },
    });

    const imageFile = result.files.find((file) =>
      file.mediaType?.startsWith("image/"),
    );

    if (!imageFile) {
      return NextResponse.json(
        { error: "Auto-fix did not return an image" },
        { status: 502 },
      );
    }

    const mediaType = imageFile.mediaType || "image/png";
    const imageDataUrl = imageFile.base64.startsWith("data:")
      ? imageFile.base64
      : `data:${mediaType};base64,${imageFile.base64}`;

    return NextResponse.json({
      success: true,
      imageDataUrl,
    });
  } catch (error) {
    console.error("Image auto-fix failed:", error);
    return NextResponse.json(
      { error: "Failed to auto-fix image" },
      { status: 500 },
    );
  }
}
