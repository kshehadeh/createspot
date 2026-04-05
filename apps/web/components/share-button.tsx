"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Bird, Copy, Instagram, Share2, Twitter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@createspot/ui-primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@createspot/ui-primitives/dropdown-menu";
import { getCreatorUrl, cn } from "@/lib/utils";

type ShareButtonPropsBase = {
  className?: string;
  /** Override default aria-label/title on the menu trigger. */
  ariaLabel?: string;
  /** Optional URL override used for share/copy payload. */
  shareUrl?: string;
  /** Optional text included in native share and social clipboard payloads. */
  shareText?: string;
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

const BLUESKY_COMPOSE_MAX_GRAPHEMES = 300;

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

function normalizeShareUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || typeof window === "undefined") return trimmed;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("sms:")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `${window.location.origin}${trimmed}`;
  }
  return trimmed;
}

function buildCaption(url: string, shareText: string | null): string {
  if (shareText) return `${shareText}\n\n${url}`;
  return url;
}

function truncateBlueskyComposeText(input: string): string {
  if (input.length <= BLUESKY_COMPOSE_MAX_GRAPHEMES) return input;
  try {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    const parts: string[] = [];
    let count = 0;
    for (const { segment } of segmenter.segment(input)) {
      if (count >= BLUESKY_COMPOSE_MAX_GRAPHEMES - 1) break;
      parts.push(segment);
      count++;
    }
    return `${parts.join("")}…`;
  } catch {
    return `${input.slice(0, BLUESKY_COMPOSE_MAX_GRAPHEMES - 1)}…`;
  }
}

/**
 * Opens the Instagram app via custom URL scheme without using `target="_blank"`.
 * Chrome (and others) open an empty tab (e.g. `chrome://newtab`) for custom schemes in a new window.
 * A hidden iframe triggers the OS / app handler while keeping the current page intact.
 */
function openInstagramApp(): void {
  if (typeof document === "undefined") return;
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;width:0;height:0;border:0;visibility:hidden;pointer-events:none;";
  iframe.src = "instagram://app";
  document.body.appendChild(iframe);
  window.setTimeout(() => {
    iframe.remove();
  }, 2000);
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
  const { type, className = "", ariaLabel, shareUrl, shareText } = props;
  const t = useTranslations("share");

  const submissionId = type === "submission" ? props.submissionId : undefined;
  const collectionId = type === "collection" ? props.collectionId : undefined;

  const canonicalUrl = getCanonicalUrl(props, null);
  const customUrl = shareUrl ? normalizeShareUrl(shareUrl) : null;
  const customText = shareText?.trim() || null;

  const resolveShareUrl = useCallback(async (): Promise<string | null> => {
    if (customUrl) return customUrl;
    if (type === "submission" || type === "collection") {
      const targetId = type === "submission" ? submissionId : collectionId;
      if (!targetId) return null;
      const apiType = type === "submission" ? "submission" : "collection";
      return fetchShortUrl(apiType, targetId);
    }
    return canonicalUrl || null;
  }, [customUrl, type, submissionId, collectionId, canonicalUrl]);

  const copyToClipboard = async (value: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleCopyUrl = async () => {
    const url = await resolveShareUrl();
    if (!url) {
      toast.error(t("failedResolveUrl"));
      return;
    }
    const ok = await copyToClipboard(url);
    if (ok) toast.success(t("urlCopied"));
    else toast.error(t("clipboardDenied"));
  };

  const handleInstagram = async () => {
    const url = await resolveShareUrl();
    if (!url) {
      toast.error(t("failedResolveUrl"));
      return;
    }
    const caption = buildCaption(url, customText);
    const ok = await copyToClipboard(caption);
    if (ok) toast.success(t("captionCopied"));
    else {
      toast.error(t("clipboardDenied"));
      return;
    }
    // Instagram does not document a public compose URL with prefilled caption; open the app so the user can paste.
    openInstagramApp();
  };

  const handleBluesky = async () => {
    const url = await resolveShareUrl();
    if (!url) {
      toast.error(t("failedResolveUrl"));
      return;
    }
    const caption = buildCaption(url, customText);
    const ok = await copyToClipboard(caption);
    if (ok) toast.success(t("captionCopied"));
    else {
      toast.error(t("clipboardDenied"));
      return;
    }
    const forIntent = truncateBlueskyComposeText(caption);
    const qs = new URLSearchParams({ text: forIntent });
    const httpsIntent = `https://bsky.app/intent/compose?${qs.toString()}`;
    // Official web intent; mobile browsers typically hand off to the Bluesky app when installed.
    window.open(httpsIntent, "_blank", "noopener,noreferrer");
  };

  const handleX = async () => {
    const url = await resolveShareUrl();
    if (!url) {
      toast.error(t("failedResolveUrl"));
      return;
    }
    const caption = buildCaption(url, customText);
    const ok = await copyToClipboard(caption);
    if (ok) toast.success(t("captionCopied"));
    else {
      toast.error(t("clipboardDenied"));
      return;
    }
    const params = new URLSearchParams();
    if (customText) params.set("text", customText);
    params.set("url", url);
    const intent = `https://twitter.com/intent/tweet?${params.toString()}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  };

  const handleSystemShare = async () => {
    if (typeof navigator.share !== "function") {
      toast.error(t("systemShareUnavailable"));
      return;
    }
    const url = await resolveShareUrl();
    if (!url) {
      toast.error(t("failedResolveUrl"));
      return;
    }
    const shareData: ShareData = { url };
    if (customText) shareData.text = customText;
    if (navigator.canShare && !navigator.canShare(shareData)) {
      toast.error(t("systemShareUnavailable"));
      return;
    }
    try {
      await navigator.share(shareData);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error(t("shareFailed"));
    }
  };

  const canSystemShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const useCustomStyle = className.length > 0;
  const triggerLabel = ariaLabel ?? t("menuAria");

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="default"
          size="icon"
          className={cn(
            !useCustomStyle && "rounded-lg active:brightness-95 [&_svg]:size-5",
            useCustomStyle && className,
          )}
          aria-label={triggerLabel}
          title={triggerLabel}
        >
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
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        <DropdownMenuItem onClick={() => void handleCopyUrl()}>
          <Copy className="text-muted-foreground" />
          {t("copyUrl")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handleInstagram()}>
          <Instagram className="text-muted-foreground" />
          {t("instagram")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handleBluesky()}>
          <Bird className="text-muted-foreground" />
          {t("bluesky")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handleX()}>
          <Twitter className="text-muted-foreground" />
          {t("x")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!canSystemShare}
          onClick={() => void handleSystemShare()}
        >
          <Share2 className="text-muted-foreground" />
          {t("systemShare")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
