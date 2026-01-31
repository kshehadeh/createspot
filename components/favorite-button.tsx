"use client";

import { motion } from "framer-motion";
import { useFavorites } from "./favorites-provider";

interface FavoriteButtonProps {
  submissionId: string;
  size?: "sm" | "md";
  className?: string;
}

export function FavoriteButton({
  submissionId,
  size = "md",
  className = "",
}: FavoriteButtonProps) {
  const { state, actions, meta } = useFavorites();
  const favorited = meta.isFavorited(submissionId);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await actions.toggleFavorite(submissionId);
  };

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const buttonSize = size === "sm" ? "h-7 w-7" : "h-8 w-8";

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      disabled={state.isLoading}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-colors hover:bg-black/70 disabled:opacity-50 ${buttonSize} ${className}`}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <motion.svg
        className={`${iconSize} ${favorited ? "text-red-500" : "text-white"}`}
        fill={favorited ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        animate={favorited ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </motion.svg>
    </motion.button>
  );
}
