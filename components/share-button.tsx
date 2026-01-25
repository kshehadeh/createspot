"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ShareButtonProps {
  submissionId: string;
  title?: string | null;
  className?: string;
  userId?: string | null;
}

export function ShareButton({
  submissionId,
  className = "",
  userId,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(
    userId || null,
  );

  // Fetch userId if not provided
  useEffect(() => {
    if (!resolvedUserId && typeof window !== "undefined") {
      const fetchSubmission = async () => {
        try {
          const response = await fetch(`/api/submissions/${submissionId}`);
          if (response.ok) {
            const data = await response.json();
            setResolvedUserId(data.submission.userId);
          }
        } catch {
          // Silently fail
        }
      };
      fetchSubmission();
    }
  }, [submissionId, resolvedUserId]);

  const shareUrl =
    typeof window !== "undefined" && resolvedUserId
      ? `${window.location.origin}/creators/${resolvedUserId}/s/${submissionId}`
      : "";

  async function handleShare() {
    // Try Web Share API first (mobile-friendly)
    // Only include URL to ensure clean copying
    const shareData = {
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // User cancelled or error occurred, fall through to clipboard
        if ((err as Error).name === "AbortError") {
          return;
        }
      }
    }

    // Fallback to clipboard - only copy the URL
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleShare}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center justify-center rounded-lg bg-zinc-900 p-2 text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 ${className}`}
      aria-label={copied ? "Link copied!" : "Share submission"}
      title={copied ? "Link copied!" : "Share submission"}
    >
      {copied ? (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      )}
    </motion.button>
  );
}
