"use client";

import type { Ref } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@createspot/ui-primitives/button";
import { cn } from "@/lib/utils";

interface CarouselNavButtonProps {
  side: "prev" | "next";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  "aria-label": string;
  /**
   * When true, button is hidden until parent with group class is hovered.
   * Use for carousel; set false or omit for lightbox so the button is always visible.
   */
  showOnHover?: boolean;
  /**
   * Semi-transparent dark overlay (lightbox / dark image) — same as overlayDark controls.
   * Default is overlayLight for feed-style carousels on light backgrounds.
   */
  overlayDark?: boolean;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

export function CarouselNavButton({
  side,
  onClick,
  disabled = false,
  "aria-label": ariaLabel,
  showOnHover = false,
  overlayDark = false,
  className,
  ref,
}: CarouselNavButtonProps) {
  const Icon = side === "prev" ? ChevronLeft : ChevronRight;

  return (
    <Button
      ref={ref}
      type="button"
      variant={overlayDark ? "overlayDark" : "overlayLight"}
      size="icon"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        showOnHover && "opacity-0 group-hover:opacity-100",
        className,
      )}
    >
      <Icon className={overlayDark ? undefined : "h-5 w-5"} />
    </Button>
  );
}
