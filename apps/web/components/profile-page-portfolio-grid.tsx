"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PortfolioGridProfile,
  type PortfolioItem,
} from "@/components/portfolio-grid";

interface ProfilePagePortfolioGridProps {
  items: PortfolioItem[];
  isLoggedIn: boolean;
  isOwnProfile: boolean;
  user?: {
    id: string;
    slug?: string | null;
    name: string | null;
    image: string | null;
  };
  featuredSubmissionId: string | null | undefined;
}

export function ProfilePagePortfolioGrid({
  items,
  isLoggedIn,
  isOwnProfile,
  user,
  featuredSubmissionId: initialFeaturedId,
}: ProfilePagePortfolioGridProps) {
  const router = useRouter();
  const [featuredSubmissionId, setFeaturedSubmissionId] = useState<
    string | null
  >(initialFeaturedId ?? null);

  useEffect(() => {
    setFeaturedSubmissionId(initialFeaturedId ?? null);
  }, [initialFeaturedId]);

  const handleSetFeatured = useCallback(
    async (item: PortfolioItem) => {
      const newFeaturedId = featuredSubmissionId === item.id ? null : item.id;
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featuredSubmissionId: newFeaturedId,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to set featured submission");
      }
      setFeaturedSubmissionId(newFeaturedId);
      router.refresh();
    },
    [featuredSubmissionId, router],
  );

  return (
    <PortfolioGridProfile
      items={items}
      isLoggedIn={isLoggedIn}
      isOwnProfile={isOwnProfile}
      user={user}
      featuredSubmissionId={featuredSubmissionId}
      onSetFeatured={isOwnProfile ? handleSetFeatured : undefined}
    />
  );
}
