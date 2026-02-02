"use workflow";

export interface ProcessUploadedImageInput {
  publicUrl: string;
  type: "submission" | "profile";
  userId: string;
  submissionId?: string;
}

async function fetchImageFromR2(publicUrl: string): Promise<Buffer> {
  "use step";

  const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");

  const baseUrl = process.env.R2_PUBLIC_URL;
  const bucket = process.env.R2_BUCKET_NAME;
  if (!baseUrl || !bucket)
    throw new Error("R2_PUBLIC_URL or R2_BUCKET_NAME not set");

  if (!publicUrl.startsWith(baseUrl))
    throw new Error("Invalid publicUrl: not an R2 URL");
  const key = publicUrl.replace(`${baseUrl}/`, "");

  const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );

  if (!response.Body) throw new Error("Empty body from R2");
  const body = response.Body as
    | { getReader?: () => ReadableStreamDefaultReader<Uint8Array> }
    | AsyncIterable<Uint8Array>;
  if ("getReader" in body && typeof body.getReader === "function") {
    const reader = (body as ReadableStream).getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c)));
  }
  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function applyWatermarkIfNeeded(
  buffer: Buffer,
  publicUrl: string,
  type: "submission" | "profile",
  userId: string,
): Promise<{ buffer: Buffer; watermarked: boolean }> {
  "use step";

  if (type !== "submission") return { buffer, watermarked: false };
  const ext = publicUrl.split(".").pop()?.toLowerCase();
  if (ext === "gif") return { buffer, watermarked: false };

  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { enableWatermark: true, watermarkPosition: true },
  });

  if (!user?.enableWatermark) return { buffer, watermarked: false };

  const { applyWatermarkWithMargin, isValidWatermarkPosition } = await import(
    "@/lib/watermark"
  );
  const position = isValidWatermarkPosition(user.watermarkPosition)
    ? user.watermarkPosition
    : "bottom-right";

  const watermarked = await applyWatermarkWithMargin(buffer, {
    position,
    opacity: 0.5,
    sizeRatio: 0.12,
    marginRatio: 0.2,
  });
  return { buffer: watermarked, watermarked: true };
}

async function processAndUploadToR2(
  buffer: Buffer,
  publicUrl: string,
  type: "submission" | "profile",
  userId: string,
): Promise<{ newPublicUrl: string; format: string }> {
  "use step";

  const { S3Client, PutObjectCommand, DeleteObjectCommand } = await import(
    "@aws-sdk/client-s3"
  );
  const crypto = await import("crypto");
  const { processImageForStorage } = await import("@/lib/upload-process");

  const baseUrl = process.env.R2_PUBLIC_URL;
  const bucket = process.env.R2_BUCKET_NAME;
  if (!baseUrl || !bucket)
    throw new Error("R2_PUBLIC_URL or R2_BUCKET_NAME not set");

  const result = await processImageForStorage(buffer);

  if (!publicUrl.startsWith(baseUrl)) throw new Error("Invalid publicUrl");
  const oldKey = publicUrl.replace(`${baseUrl}/`, "");

  const folder = type === "profile" ? "profiles" : "submissions";
  const newKey = `${folder}/${userId}/${crypto.randomUUID()}.${result.extension}`;
  const newPublicUrl = `${baseUrl}/${newKey}`;

  const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: newKey,
      Body: result.buffer,
      ContentType: result.contentType,
    }),
  );

  await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: oldKey }));

  return { newPublicUrl, format: result.extension };
}

async function updateDatabase(
  type: "submission" | "profile",
  userId: string,
  submissionId: string | undefined,
  newPublicUrl: string,
  metadata: { watermarked: boolean; compressed: boolean; format: string },
): Promise<void> {
  "use step";

  const { prisma } = await import("@/lib/prisma");
  const now = new Date();

  if (type === "submission" && submissionId) {
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        imageUrl: newPublicUrl,
        imageProcessingMetadata: metadata as object,
        imageProcessedAt: now,
      },
    });
    return;
  }

  if (type === "profile") {
    await prisma.user.update({
      where: { id: userId },
      data: { profileImageUrl: newPublicUrl },
    });
  }
}

export async function processUploadedImage(
  input: ProcessUploadedImageInput,
): Promise<{ success: boolean; error?: string }> {
  const { publicUrl, type, userId, submissionId } = input;

  try {
    const buffer = await fetchImageFromR2(publicUrl);
    const { buffer: afterWatermark, watermarked } =
      await applyWatermarkIfNeeded(buffer, publicUrl, type, userId);
    const { newPublicUrl, format } = await processAndUploadToR2(
      afterWatermark,
      publicUrl,
      type,
      userId,
    );
    const metadata = {
      watermarked,
      compressed: true,
      format,
    };
    await updateDatabase(type, userId, submissionId, newPublicUrl, metadata);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[process-uploaded-image] Error:", message, error);
    return { success: false, error: message };
  }
}
