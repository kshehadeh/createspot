"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useFavorites } from "./favorites-provider";

interface FavoriteButtonProps {
  submissionId: string;
  size?: "sm" | "md";
  className?: string;
  /** Icon color when not favorited (e.g. `text-white` on dark overlays). */
  iconClassName?: string;
  /**
   * Server total from `_count.favorites` at load. When set, shown beside the icon
   * (optimistically adjusted when the viewer toggles favorite).
   */
  count?: number;
  /**
   * When true and a count is shown, keep a fixed circular footprint: smaller icon,
   * compact count text, no horizontal expansion (matches comments FAB on mobile).
   */
  inlineCount?: boolean;
}

export function FavoriteButton({
  submissionId,
  size = "md",
  className = "",
  iconClassName,
  count,
  inlineCount = false,
}: FavoriteButtonProps) {
  const { state, actions, meta } = useFavorites();
  const favorited = meta.isFavorited(submissionId);

  const prevSubmissionId = useRef(submissionId);
  const baselineFavoritedRef = useRef<boolean | null>(null);
  if (prevSubmissionId.current !== submissionId) {
    prevSubmissionId.current = submissionId;
    baselineFavoritedRef.current = null;
  }

  if (!state.favoritesQueryResolved) {
    baselineFavoritedRef.current = null;
  } else if (baselineFavoritedRef.current === null) {
    baselineFavoritedRef.current = favorited;
  }

  const displayCount = Math.max(
    0,
    count == null
      ? 0
      : !state.favoritesQueryResolved
        ? count
        : count + (favorited ? 1 : 0) - (baselineFavoritedRef.current ? 1 : 0),
  );

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await actions.toggleFavorite(submissionId);
  };

  const useCustomStyle = className.length > 0;
  const showCount = count != null && displayCount > 0;
  const compactCount = inlineCount && showCount;
  const expandForCount = showCount && !inlineCount;
  const iconSize = compactCount
    ? "h-4 w-4"
    : size === "sm"
      ? "h-5 w-5"
      : "h-6 w-6";
  // Keep a larger tap target (especially for mobile).
  const buttonSize = size === "sm" ? "h-10 w-10" : "h-11 w-11";
  const buttonClassName = useCustomStyle
    ? cn(
        className,
        expandForCount && "w-auto min-w-10 shrink-0 gap-1 px-2",
        compactCount && "!gap-0.5 px-0",
      )
    : cn(
        `flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-colors hover:bg-black/70 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${buttonSize}`,
        expandForCount && "w-auto min-w-10 gap-1 px-2",
        compactCount && "gap-0.5",
      );
  const iconColorClass = iconClassName
    ? favorited
      ? "text-red-500"
      : iconClassName
    : useCustomStyle
      ? favorited
        ? "text-red-500"
        : "text-muted-foreground"
      : favorited
        ? "text-red-500"
        : "text-white";

  const heart = (
    <motion.svg
      key={favorited ? "favorited" : "unfavorited"}
      className={`${iconSize} shrink-0 ${iconColorClass}`}
      fill={favorited ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      animate={
        favorited
          ? { scale: [1, 1.65, 0.95, 1] }
          : { scale: [1, 0.75, 1.05, 1] }
      }
      transition={{
        duration: 0.42,
        times: [0, 0.35, 0.7, 1],
        ease: ["easeOut", "easeInOut", "easeOut"],
      }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </motion.svg>
  );

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      disabled={state.isLoading}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={buttonClassName}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={favorited}
    >
      {showCount ? (
        <>
          {heart}
          <span
            className={cn(
              "tabular-nums",
              inlineCount
                ? "text-[11px] font-medium leading-none text-foreground"
                : "text-sm text-muted-foreground",
            )}
          >
            {displayCount}
          </span>
        </>
      ) : (
        heart
      )}
    </motion.button>
  );
}
