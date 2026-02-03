"use client";

import { useCallback } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { SelectionData } from "@/lib/critique-fragments";

interface SelectionThumbnailProps {
  selectionData: SelectionData;
  onClick: () => void;
}

export function SelectionThumbnail({
  selectionData,
  onClick,
}: SelectionThumbnailProps) {
  const t = useTranslations("critique");

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick();
    },
    [onClick],
  );

  if (selectionData.type === "image") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden border-2 border-border hover:border-primary transition-colors cursor-pointer"
        aria-label={t("viewSelection")}
      >
        <Image
          src={selectionData.fragmentUrl}
          alt={t("imageSelection")}
          fill
          className="object-cover"
          sizes="80px"
        />
      </button>
    );
  }

  // Text selection
  const preview = selectionData.originalText.slice(0, 50);
  const truncated =
    selectionData.originalText.length > 50 ? `${preview}...` : preview;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-left text-sm text-muted-foreground hover:text-foreground transition-colors border border-border hover:border-primary rounded-md px-3 py-2 max-w-xs cursor-pointer"
      aria-label={t("viewSelection")}
    >
      <span className="text-xs font-medium text-foreground/70">
        {t("textSelection")}:
      </span>
      <div className="mt-1 italic">&ldquo;{truncated}&rdquo;</div>
    </button>
  );
}
