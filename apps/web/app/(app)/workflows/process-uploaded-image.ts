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
  const { getR2KeyFromPublicUrl, normalizeR2PublicUrl } = await import(
    "@/lib/r2-url"
  );

  const baseUrl = normalizeR2PublicUrl(process.env.R2_PUBLIC_URL);
  const bucket = process.env.R2_BUCKET_NAME;
  if (!baseUrl || !bucket)
    throw new Error("R2_PUBLIC_URL or R2_BUCKET_NAME not set");

  const key = getR2KeyFromPublicUrl(publicUrl, baseUrl);
  if (!key) throw new Error("Invalid publicUrl: not an R2 URL");

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
): Promise<{
  newPublicUrl: string;
  newKey: string;
  oldKey: string;
  format: string;
}> {
  "use step";

  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const crypto = await import("crypto");
  const { processImageForStorage } = await import("@/lib/upload-process");
  const { getR2KeyFromPublicUrl, joinR2PublicUrl, normalizeR2PublicUrl } =
    await import("@/lib/r2-url");

  const baseUrl = normalizeR2PublicUrl(process.env.R2_PUBLIC_URL);
  const bucket = process.env.R2_BUCKET_NAME;
  if (!baseUrl || !bucket)
    throw new Error("R2_PUBLIC_URL or R2_BUCKET_NAME not set");

  const result = await processImageForStorage(buffer);

  const oldKey = getR2KeyFromPublicUrl(publicUrl, baseUrl);
  if (!oldKey) throw new Error("Invalid publicUrl");

  const folder = type === "profile" ? "profiles" : "submissions";
  const newKey = `${folder}/${userId}/${crypto.randomUUID()}.${result.extension}`;
  const newPublicUrl = joinR2PublicUrl(baseUrl, newKey);
  if (!newPublicUrl) throw new Error("R2_PUBLIC_URL not set");

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

  return { newPublicUrl, newKey, oldKey, format: result.extension };
}

async function updateDatabase(
  type: "submission" | "profile",
  userId: string,
  submissionId: string | undefined,
  originalPublicUrl: string,
  newPublicUrl: string,
  metadata: { watermarked: boolean; compressed: boolean; format: string },
): Promise<{ swapped: boolean }> {
  "use step";

  const { prisma } = await import("@/lib/prisma");
  const now = new Date();

  if (type === "submission" && submissionId) {
    const result = await prisma.submission.updateMany({
      where: { id: submissionId, imageUrl: originalPublicUrl },
      data: {
        imageUrl: newPublicUrl,
        imageProcessingMetadata: metadata as object,
        imageProcessedAt: now,
      },
    });
    return { swapped: result.count > 0 };
  }

  if (type === "profile") {
    const result = await prisma.user.updateMany({
      where: { id: userId, profileImageUrl: originalPublicUrl },
      data: { profileImageUrl: newPublicUrl },
    });
    return { swapped: result.count > 0 };
  }

  return { swapped: false };
}

async function deleteObjectFromR2(key: string): Promise<void> {
  "use step";

  const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME not set");

  const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function processUploadedImage(
  input: ProcessUploadedImageInput,
): Promise<{ success: boolean; error?: string }> {
  const { publicUrl, type, userId, submissionId } = input;

  try {
    console.info("[process-uploaded-image] start", {
      type,
      userId,
      submissionId,
      publicUrl,
    });

    const buffer = await fetchImageFromR2(publicUrl);
    const { buffer: afterWatermark, watermarked } =
      await applyWatermarkIfNeeded(buffer, publicUrl, type, userId);
    const { newPublicUrl, format, newKey, oldKey } = await processAndUploadToR2(
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

    const { swapped } = await updateDatabase(
      type,
      userId,
      submissionId,
      publicUrl,
      newPublicUrl,
      metadata,
    );

    if (swapped) {
      try {
        await deleteObjectFromR2(oldKey);
      } catch (error) {
        console.error("[process-uploaded-image] failed to delete old object", {
          type,
          userId,
          submissionId,
          oldKey,
          error,
        });
      }
      console.info("[process-uploaded-image] swapped", {
        type,
        userId,
        submissionId,
        newPublicUrl,
        format,
        watermarked,
      });
      return { success: true };
    }

    // The submission/profile moved on (newer image), so clean up the processed object we just created.
    try {
      await deleteObjectFromR2(newKey);
    } catch (error) {
      console.error("[process-uploaded-image] failed to cleanup stale output", {
        type,
        userId,
        submissionId,
        newKey,
        error,
      });
    }

    console.info("[process-uploaded-image] stale job skipped", {
      type,
      userId,
      submissionId,
      publicUrl,
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[process-uploaded-image] Error:", message, error);
    return { success: false, error: message };
  }
}
