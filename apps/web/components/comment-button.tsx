"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@createspot/ui-primitives/button";
import { cn } from "@/lib/utils";

interface CommentButtonProps {
  count: number;
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
  variant?: "default" | "overlayDark";
  ariaLabel?: string;
}

export function CommentButton({
  count,
  onClick,
  className,
  iconClassName,
  variant = "default",
  ariaLabel,
}: CommentButtonProps) {
  return (
    <Button
      variant={variant === "overlayDark" ? "overlayDark" : "ghost"}
      size="icon"
      className={cn(
        variant === "default" &&
          "h-8 w-8 rounded-full text-foreground hover:bg-muted hover:text-foreground",
        variant === "overlayDark" &&
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border !border-white/20 !bg-white/10 text-white shadow-sm hover:!bg-white/20",
        className,
      )}
      onClick={onClick}
      aria-label={ariaLabel || `Comments (${count})`}
    >
      <MessageCircle className={cn("h-5 w-5", iconClassName)} />
      {count > 0 && (
        <span
          className={cn(
            "ml-0.5 text-xs font-medium",
            variant === "overlayDark" && "text-white",
          )}
        >
          {count}
        </span>
      )}
    </Button>
  );
}
