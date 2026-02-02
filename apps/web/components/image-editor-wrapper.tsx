"use client";

import dynamic from "next/dynamic";

// Heavy component - dynamically import to reduce initial bundle
const ImageEditor = dynamic(
  () => import("@/components/image-editor").then((mod) => mod.ImageEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    ),
  },
);

interface ImageEditorWrapperProps {
  submissionId: string;
  imageUrl: string;
  submissionTitle: string | null;
}

export function ImageEditorWrapper({
  submissionId,
  imageUrl,
  submissionTitle,
}: ImageEditorWrapperProps) {
  return (
    <ImageEditor
      submissionId={submissionId}
      imageUrl={imageUrl}
      submissionTitle={submissionTitle}
    />
  );
}
