"use client";

import { forwardRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  className?: string;
}

export const CarouselNavButton = forwardRef<
  HTMLButtonElement,
  CarouselNavButtonProps
>(function CarouselNavButton(
  {
    side,
    onClick,
    disabled = false,
    "aria-label": ariaLabel,
    showOnHover = false,
    className,
  },
  ref,
) {
  const Icon = side === "prev" ? ChevronLeft : ChevronRight;

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "rounded-full bg-background/80 p-2 shadow-md backdrop-blur-sm transition-opacity hover:bg-background disabled:pointer-events-none disabled:opacity-0",
        showOnHover && "opacity-0 group-hover:opacity-100",
        className,
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
});
