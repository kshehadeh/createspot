"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
  className?: string;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function FollowButton({
  targetUserId,
  initialIsFollowing,
  className,
  variant = "outline",
  size = "sm",
}: FollowButtonProps) {
  const t = useTranslations("profile");
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      if (isFollowing) {
        const res = await fetch(
          `/api/follow?followingId=${encodeURIComponent(targetUserId)}`,
          { method: "DELETE" },
        );
        if (res.ok) setIsFollowing(false);
      } else {
        const res = await fetch("/api/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followingId: targetUserId }),
        });
        if (res.ok) setIsFollowing(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={loading}
      aria-label={isFollowing ? t("unfollow") : t("follow")}
    >
      {isFollowing ? (
        <>
          <UserMinus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("following")}</span>
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("follow")}</span>
        </>
      )}
    </Button>
  );
}
