# Image Handling

This document describes how the app uploads, stores, and post-processes images for submissions and profile photos.

## Overview

- **Storage:** All images are stored in Cloudflare R2. Submission images live under `submissions/{userId}/{uuid}.{ext}`; profile images under `profiles/{userId}/{uuid}.{ext}`.
- **Upload path:** The client never sends file bytes to the app. Instead, it requests a **presigned URL** from the API, uploads **directly to R2**, then saves the submission or profile with that **raw URL**. The save API triggers a **background workflow** that post-processes the image (resize, WebP, optional watermark) and updates the stored URL and metadata when done.
- **Result:** Users see “saved” immediately; for a short time the app may serve the raw image, then the stored URL points to the optimized version. This increases R2 operations (raw then optimized) but improves perceived speed and avoids Vercel’s request-body size limit.

## Limits and allowed types

- **Max file size:** 6 MB (enforced at presign and in client validation).
- **Allowed types:** JPEG, PNG, WebP, GIF (validated by `Content-Type` at presign).
- **Presigned URL expiry:** 5 minutes.

Configuration lives in [app/api/upload/presign/route.ts](app/api/upload/presign/route.ts).

## Upload flow (step by step)

1. **Client requests a presigned URL**  
   `POST /api/upload/presign` with body `{ fileType, fileSize, type?: "submission" | "profile" }`.  
   Response: `{ presignedUrl, publicUrl, expiresIn }`.  
   The `publicUrl` is the final URL of the object once uploaded (e.g. `https://<R2_PUBLIC_URL>/submissions/<userId>/<uuid>.<ext>`).

2. **Client uploads directly to R2**  
   `PUT` the file to `presignedUrl` with the appropriate `Content-Type` (and size if needed). No file is sent to the app.

3. **Client saves with the raw URL**  
   For submissions: `POST /api/submissions` with `imageUrl: publicUrl` (and other fields).  
   For profile: `PUT /api/profile` with `profileImageUrl: publicUrl`.  
   The API writes the raw URL to the database and returns success immediately.

4. **Save API triggers the workflow (fire-and-forget)**  
   If the image URL is from our R2 bucket, the submissions or profile API calls `processUploadedImage({ publicUrl, type, userId, submissionId? })` without awaiting. The workflow runs in the background. **Submission update** (`PUT /api/submissions/[id]`) also triggers the workflow when the image is from R2 and either the image was just changed in the request or metadata indicates it was not yet processed (so legacy submissions get processed on next edit).

5. **Workflow post-processes and updates the database**  
   See [Post-processing workflow](#post-processing-workflow) below. When it finishes, it updates `Submission.imageUrl` (and metadata) or the user’s `profileImageUrl` to the new optimized URL and, for submissions, sets `imageProcessingMetadata` and `imageProcessedAt`.

So the client only ever uses the raw `publicUrl` when saving; it does not call any “process after upload” endpoint.

## Post-processing workflow

The workflow is implemented in [app/workflows/process-uploaded-image.ts](app/workflows/process-uploaded-image.ts). It is invoked with `{ publicUrl, type: "submission" | "profile", userId, submissionId? }` (submissionId only for submissions).

Steps (each is a durable step in the workflow runtime):

1. **Fetch image from R2**  
   Derive the object key from `publicUrl` (strip `R2_PUBLIC_URL` prefix), then GET the object and read the body into a buffer.

2. **Optional watermark (submissions only)**  
   If `type === "submission"` and the user has watermarking enabled, and the file is not a GIF, the workflow loads the user’s watermark settings and applies the watermark via [lib/watermark.ts](lib/watermark.ts) (`applyWatermarkWithMargin`). Profile images are not watermarked.

3. **Resize and convert (or pass through GIF)**  
   The buffer is passed to the shared helper `processImageForStorage` (see [Shared processing helper](#shared-processing-helper)). For JPEG/PNG/WebP this resizes (long edge ≤ 2048 px) and encodes as WebP (quality 85). GIFs are returned unchanged.

4. **Upload result to R2 and delete original**  
   The processed buffer is uploaded to a **new** key: same folder (`submissions/{userId}` or `profiles/{userId}`), new UUID, extension from the helper (`.webp` or `.gif`). The original R2 object is then deleted.

5. **Update database**  
   - **Submissions:** `Submission` is updated with the new `imageUrl`, `imageProcessingMetadata` (e.g. `{ watermarked, compressed, format }`), and `imageProcessedAt`.  
   - **Profile:** The user’s `profileImageUrl` is updated to the new URL. No processing metadata is stored for profile images.

All dependencies used inside steps are loaded via dynamic `import()` so the workflow works when steps run in isolation.

## Shared processing helper

[lib/upload-process.ts](lib/upload-process.ts) exports `processImageForStorage(buffer, options?)`:

- **Options:** `maxLongEdge` (default 2048), `webpQuality` (default 85).
- **GIF:** Returned as-is (no resize, no re-encode) so animations and compatibility are preserved.
- **JPEG / PNG / WebP:** Resized with Sharp so the long edge is ≤ `maxLongEdge` (fit inside, no enlargement), then encoded as WebP with the given quality. Returned as `image/webp` with extension `webp`.
- **Other formats:** Pass-through with best-guess content type and extension.

Return type: `{ buffer, contentType, extension }`.

This helper is used by:

- The post-processing workflow (after optional watermark).
- The submission image-replace API ([app/api/submissions/[id]/image/route.ts](app/api/submissions/[id]/image/route.ts)).

## Submission image replace

`POST /api/submissions/[id]/image` replaces the image for an existing submission (e.g. after in-app editing). The client sends the new image in the request body.

- The file is run through `processImageForStorage` (same resize/WebP or GIF passthrough as the workflow).
- The R2 key is derived from the submission’s current `imageUrl`. The new object is written with the extension from the helper (e.g. `.webp`). If the extension changes (e.g. was `.jpeg`, now `.webp`), the new key is used, the old R2 object is deleted, and the submission’s `imageUrl` is updated. If the key is unchanged (e.g. already `.webp`), the object is overwritten in place and the URL stays the same.
- The submission’s `imageProcessingMetadata` and `imageProcessedAt` are set (e.g. `watermarked: false`, `compressed: true`, `format: "webp"`). The replace flow does not apply a watermark; watermarking is only applied in the upload workflow for new submissions.

## Submission processing metadata

On the `Submission` model (Prisma):

- **`imageProcessingMetadata`** (JSON, optional): Describes what post-processing was applied, for display or debugging. Shape: `{ watermarked?: boolean, compressed?: boolean, format?: string }` (e.g. `"webp"` or `"gif"`). `null` or missing means not yet processed or legacy data.
- **`imageProcessedAt`** (DateTime, optional): When post-processing completed.

Only submissions have these fields; profile images do not. They are set by the post-processing workflow and by the submission image-replace API.

## R2 paths and URLs

- **Submission images:** `submissions/{userId}/{uuid}.{ext}` — e.g. `.webp` or `.gif` after processing.
- **Profile images:** `profiles/{userId}/{uuid}.{ext}`.

The public URL is `{R2_PUBLIC_URL}/{key}`. CORS must be configured on the R2 bucket for browser `PUT` uploads; see [docs/DATABASE.md](DATABASE.md) for R2 and CORS setup.

## Deprecated: file-in-body upload

`POST /api/upload` (uploading the file in the request body) is **deprecated**. It returns `410 Gone` with a message directing clients to use presign and then save with the raw URL. All uploads should go through the presign → R2 → save flow so that post-processing runs consistently via the workflow.

## Summary of key files

| Purpose | File |
|--------|------|
| Presign | [app/api/upload/presign/route.ts](app/api/upload/presign/route.ts) |
| Post-processing workflow | [app/workflows/process-uploaded-image.ts](app/workflows/process-uploaded-image.ts) |
| Shared resize/WebP helper | [lib/upload-process.ts](lib/upload-process.ts) |
| Watermark | [lib/watermark.ts](lib/watermark.ts) |
| Submission image replace | [app/api/submissions/[id]/image/route.ts](app/api/submissions/[id]/image/route.ts) |
| Trigger workflow from save | [app/api/submissions/route.ts](app/api/submissions/route.ts), [app/api/submissions/[id]/route.ts](app/api/submissions/[id]/route.ts) (PUT), [app/api/profile/route.ts](app/api/profile/route.ts) |
| Deprecated upload | [app/api/upload/route.ts](app/api/upload/route.ts) |

For R2 bucket configuration, environment variables, and CORS, see [docs/DATABASE.md](DATABASE.md). For watermarking and creator protections, see [docs/CREATOR-PROTECTIONS.md](CREATOR-PROTECTIONS.md).
