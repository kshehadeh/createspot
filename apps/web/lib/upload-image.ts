export type UploadImageType =
  | "submission"
  | "profile"
  | "progression"
  | "reference";

export interface UploadImageMessages {
  selectImageFile?: string;
  imageTooLarge?: string;
  uploadFailed?: string;
  presignFailed?: string;
}

export interface UploadImageToR2Options {
  file: File;
  type: UploadImageType;
  submissionId?: string;
  messages?: UploadImageMessages;
}

export interface UploadImageToR2Result {
  publicUrl?: string;
  error?: string;
}

const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB

export async function uploadImageToR2(
  options: UploadImageToR2Options,
): Promise<UploadImageToR2Result> {
  const { file, type, submissionId, messages } = options;

  if (!file.type.startsWith("image/")) {
    return {
      error: messages?.selectImageFile || "Please select an image file",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      error:
        messages?.imageTooLarge ||
        `Image must be less than ${MAX_FILE_SIZE / (1024 * 1024)} MB`,
    };
  }

  try {
    const presignResponse = await fetch("/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileType: file.type,
        fileSize: file.size,
        type,
        submissionId,
      }),
    });

    if (!presignResponse.ok) {
      const data = await presignResponse.json().catch(() => null);
      return {
        error:
          data?.error || messages?.presignFailed || "Failed to get upload URL",
      };
    }

    const { presignedUrl, publicUrl } = (await presignResponse.json()) as {
      presignedUrl: string;
      publicUrl: string;
    };

    const uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!uploadResponse.ok) {
      return {
        error: messages?.uploadFailed || "Failed to upload image",
      };
    }

    return { publicUrl };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : messages?.uploadFailed || "Failed to upload image",
    };
  }
}

export function filenameToTitle(filename: string): string {
  const withoutExtension = filename.replace(/\.[^/.]+$/, "");
  return withoutExtension.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}
