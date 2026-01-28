import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/upload (file-in-body) is deprecated.
 * All uploads go via presign: POST /api/upload/presign returns { presignedUrl, publicUrl };
 * client uploads directly to R2, then saves submission/profile with the raw URL.
 * The save API triggers post-processing (resize, WebP, watermark) in a background workflow.
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      error:
        "This upload endpoint is deprecated. Use POST /api/upload/presign to get a presigned URL, upload directly to R2, then save with the returned publicUrl.",
    },
    { status: 410 },
  );
}
