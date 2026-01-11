"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getUserImageUrl } from "@/lib/user-image";
import { getObjectPositionStyle } from "@/lib/image-utils";
import { ProfileImageModal } from "@/components/profile-image-modal";
import { toast } from "sonner";

interface ProfileHeaderProps {
  profileImageUrl: string | null;
  oauthImage: string | null;
  profileImageFocalPoint: { x: number; y: number } | null;
  name: string | null;
}

export function ProfileHeader({
  profileImageUrl,
  oauthImage,
  profileImageFocalPoint,
  name,
}: ProfileHeaderProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayImage = getUserImageUrl(profileImageUrl, oauthImage);

  const handleSave = async (
    imageUrl: string | null,
    focalPoint: { x: number; y: number } | null,
  ) => {
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileImageUrl: imageUrl || null,
          profileImageFocalPoint: focalPoint || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile image");
      }

      router.refresh();
    } catch {
      toast.error("Failed to save profile image");
    }
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="group relative shrink-0 cursor-pointer transition-opacity hover:opacity-80"
          aria-label="Edit profile image"
        >
          {displayImage ? (
            <div className="h-12 w-12 rounded-full md:h-16 md:w-16 ring-2 ring-background/50 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage}
                alt={name || "Profile"}
                className="h-full w-full object-cover"
                style={{
                  objectPosition: getObjectPositionStyle(
                    profileImageFocalPoint,
                  ),
                }}
              />
            </div>
          ) : (
            <div className="h-12 w-12 flex items-center justify-center rounded-full bg-muted md:h-16 md:w-16 ring-2 ring-background/50">
              <span className="text-xl font-medium text-muted-foreground md:text-2xl">
                {name?.charAt(0) || "?"}
              </span>
            </div>
          )}
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {name || "Anonymous"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Edit your profile information
          </p>
        </div>
      </div>

      <ProfileImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentImageUrl={profileImageUrl}
        oauthImage={oauthImage}
        currentFocalPoint={profileImageFocalPoint}
        onSave={handleSave}
      />
    </>
  );
}
