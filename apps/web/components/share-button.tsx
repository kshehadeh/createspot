"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getCreatorUrl, cn } from "@/lib/utils";

type ShareButtonPropsBase = {
  className?: string;
  /** Override default aria-label/title (e.g. "Copy submission link"). */
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
  { copy: string; copied: string }
> = {
  submission: { copy: "Copy submission link", copied: "Link copied!" },
  collection: { copy: "Copy collection link", copied: "Link copied!" },
  profile: { copy: "Copy profile link", copied: "Link copied!" },
  portfolio: { copy: "Copy portfolio link", copied: "Link copied!" },
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

/** Dedupe concurrent fetches for the same target (e.g. double-click or parallel UI). */
const shortLinkInflight = new Map<string, Promise<string | null>>();

async function fetchShortUrl(
  apiType: "submission" | "collection",
  targetId: string,
): Promise<string | null> {
  const key = `${apiType}:${targetId}`;
  let promise = shortLinkInflight.get(key);
  if (!promise) {
    promise = (async () => {
      try {
        const res = await fetch(
          `/api/short-link?type=${apiType}&targetId=${encodeURIComponent(targetId)}`,
        );
        if (!res.ok) return null;
        const data = (await res.json()) as { code?: string; shortUrl?: string };
        if (data.shortUrl && typeof data.shortUrl === "string")
          return data.shortUrl;
        if (data.code && typeof window !== "undefined") {
          const base = window.location.origin.replace(/\/$/, "");
          return `${base}/s/${data.code}`;
        }
      } catch {
        // ignore
      }
      return null;
    })();
    shortLinkInflight.set(key, promise);
    void promise.finally(() => {
      shortLinkInflight.delete(key);
    });
  }
  return promise;
}

export function ShareButton(props: ShareButtonProps) {
  const { type, className = "", ariaLabel } = props;

  const [copied, setCopied] = useState(false);

  const submissionId = type === "submission" ? props.submissionId : undefined;
  const collectionId = type === "collection" ? props.collectionId : undefined;

  const canonicalUrl = getCanonicalUrl(props, null);

  async function handleCopy() {
    let urlToCopy: string | null = null;

    if (type === "submission" || type === "collection") {
      const targetId = type === "submission" ? submissionId : collectionId;
      if (!targetId) return;
      const apiType = type === "submission" ? "submission" : "collection";
      // Only ever copy `/s/{code}` from the short-link API, never the canonical creator URL.
      // Fetch on demand so the home feed does not N+1 `/api/short-link` on pageload.
      urlToCopy = await fetchShortUrl(apiType, targetId);
      if (!urlToCopy) return;
    } else {
      urlToCopy = canonicalUrl || null;
    }

    if (!urlToCopy) return;

    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be denied without permission
    }
  }

  const labels = DEFAULT_LABELS[type];
  const label = ariaLabel ?? (copied ? labels.copied : labels.copy);

  const useCustomStyle = className.length > 0;

  return (
    <Button
      type="button"
      variant="default"
      size="icon"
      onClick={() => void handleCopy()}
      className={cn(
        !useCustomStyle && "rounded-lg active:brightness-95 [&_svg]:size-5",
        useCustomStyle && className,
      )}
      aria-label={label}
      title={label}
    >
      {copied ? (
        <svg
          className={useCustomStyle ? "h-4 w-4" : "h-5 w-5"}
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
          className={useCustomStyle ? "h-4 w-4" : "h-5 w-5"}
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
    </Button>
  );
}
