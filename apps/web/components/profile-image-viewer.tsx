"use client";

import { useState } from "react";
import { ImageLightbox } from "@/components/image-lightbox";
import { getUserImageUrl } from "@/lib/user-image";
import { getObjectPositionStyle } from "@/lib/image-utils";

interface ProfileImageViewerProps {
  profileImageUrl: string | null;
  oauthImage: string | null;
  profileImageFocalPoint: { x: number; y: number } | null;
  name: string | null;
  className?: string;
}

export function ProfileImageViewer({
  profileImageUrl,
  oauthImage,
  profileImageFocalPoint,
  name,
  className = "",
}: ProfileImageViewerProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const displayImage = getUserImageUrl(profileImageUrl, oauthImage);

  if (!displayImage) {
    return null;
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={displayImage}
        alt={name || "User"}
        className={`cursor-pointer ${className}`}
        style={{
          objectPosition: getObjectPositionStyle(profileImageFocalPoint),
        }}
        onClick={() => setIsLightboxOpen(true)}
      />
      <ImageLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageUrl={displayImage}
        alt={name || "User"}
        focalPoint={profileImageFocalPoint}
      />
    </>
  );
}
