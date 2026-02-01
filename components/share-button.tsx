"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getCreatorUrl } from "@/lib/utils";

type ShareButtonPropsBase = {
  className?: string;
  /** Override default aria-label/title (e.g. "Share submission"). */
  ariaLabel?: string;
};

type ShareButtonProps =
  | (ShareButtonPropsBase & {
      type: "submission";
      submissionId: string;
      userId?: string | null;
      userSlug?: string | null;
    })
  | (ShareButtonPropsBase & {
      type: "collection";
      userId: string;
      slug?: string | null;
      collectionId: string;
    })
  | (ShareButtonPropsBase & {
      type: "profile";
      userId: string;
      slug?: string | null;
    })
  | (ShareButtonPropsBase & {
      type: "portfolio";
      userId: string;
    });

const DEFAULT_LABELS: Record<
  NonNullable<ShareButtonProps["type"]>,
  { share: string; copied: string }
> = {
  submission: { share: "Share submission", copied: "Link copied!" },
  collection: { share: "Share collection", copied: "Link copied!" },
  profile: { share: "Share profile", copied: "Link copied!" },
  portfolio: { share: "Share portfolio", copied: "Link copied!" },
};

function getCanonicalUrl(
  props: ShareButtonProps,
  resolvedUser: { id: string; slug: string | null } | null,
): string {
  if (typeof window === "undefined") return "";
  const origin = window.location.origin;
  switch (props.type) {
    case "submission":
      return resolvedUser
        ? `${origin}${getCreatorUrl(resolvedUser)}/s/${props.submissionId}`
        : "";
    case "collection":
      return `${origin}${getCreatorUrl({ id: props.userId, slug: props.slug ?? null })}/collections/${props.collectionId}`;
    case "profile":
      return `${origin}${getCreatorUrl({ id: props.userId, slug: props.slug ?? null })}`;
    case "portfolio":
      return `${origin}/creators/${props.userId}/portfolio`;
    default:
      return "";
  }
}

function getShortLinkType(
  type: ShareButtonProps["type"],
): { type: string; targetId: string } | null {
  switch (type) {
    case "submission":
      return { type: "submission", targetId: "" };
    case "collection":
      return { type: "collection", targetId: "" };
    default:
      return null;
  }
}

export function ShareButton(props: ShareButtonProps) {
  const { type, className = "", ariaLabel } = props;

  const [copied, setCopied] = useState(false);
  const [resolvedUser, setResolvedUser] = useState<{
    id: string;
    slug: string | null;
  } | null>(
    type === "submission" && props.userId
      ? { id: props.userId, slug: props.userSlug ?? null }
      : null,
  );

  const submissionId = type === "submission" ? props.submissionId : undefined;
  useEffect(() => {
    if (
      type !== "submission" ||
      resolvedUser ||
      typeof window === "undefined" ||
      !submissionId
    ) {
      return;
    }
    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/submissions/${submissionId}`);
        if (response.ok) {
          const data = await response.json();
          setResolvedUser({
            id: data.submission.userId,
            slug: data.submission.user?.slug ?? null,
          });
        }
      } catch {
        // Silently fail
      }
    };
    fetchSubmission();
  }, [type, submissionId, resolvedUser]);

  const canonicalUrl = getCanonicalUrl(
    props,
    type === "submission" ? resolvedUser : null,
  );

  async function handleShare() {
    let urlToShare = canonicalUrl;
    const shortLink = getShortLinkType(type);
    if (shortLink) {
      const targetId =
        type === "submission"
          ? props.submissionId
          : type === "collection"
            ? props.collectionId
            : "";
      try {
        const res = await fetch(
          `/api/short-link?type=${shortLink.type}&targetId=${encodeURIComponent(targetId)}`,
        );
        if (res.ok) {
          const data = (await res.json()) as {
            code?: string;
            shortUrl?: string;
          };
          if (data.shortUrl && typeof data.shortUrl === "string") {
            urlToShare = data.shortUrl;
          } else if (data.code && typeof window !== "undefined") {
            const base = window.location.origin.replace(/\/$/, "");
            urlToShare = `${base}/s/${data.code}`;
          }
        }
      } catch {
        // Use canonical URL on error
      }
    }

    if (!urlToShare) return;

    const shareData = { url: urlToShare };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(urlToShare);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }

  const labels = DEFAULT_LABELS[type];
  const label = ariaLabel ?? (copied ? labels.copied : labels.share);

  return (
    <motion.button
      type="button"
      onClick={handleShare}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center justify-center rounded-lg bg-primary p-2 text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground ${className}`}
      aria-label={label}
      title={label}
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
