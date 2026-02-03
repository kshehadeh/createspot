"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";

interface SubmissionImageProps {
  imageUrl: string;
  alt: string;
  tags?: string[];
  /** Focal point for image cropping */
  /** Height classes for the container. Defaults to submission detail heights. */
  heightClasses?: string;
  /** Additional wrapper classes */
  className?: string;
  /** Callback when expand button is clicked */
  onExpand?: () => void;
  /** Whether to enable download protection. Default: true */
  protectionEnabled?: boolean;
}

export function SubmissionImage({
  imageUrl,
  alt,
  tags = [],
  heightClasses = "h-[65vh] sm:h-[72vh] md:h-[80vh]",
  className = "",
  onExpand,
  protectionEnabled = true,
}: SubmissionImageProps) {
  // Prevent right-click context menu
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (protectionEnabled) {
        e.preventDefault();
        return false;
      }
    },
    [protectionEnabled],
  );

  // Prevent drag start
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (protectionEnabled) {
        e.preventDefault();
        return false;
      }
    },
    [protectionEnabled],
  );

  return (
    <div
      className={`protected-image-wrapper relative w-full overflow-hidden rounded-xl ${heightClasses} ${className} ${onExpand ? "cursor-pointer" : ""}`}
      onClick={onExpand}
      onContextMenu={handleContextMenu}
      style={{
        backgroundImage: `
          repeating-linear-gradient(
            45deg,
            hsl(var(--muted)),
            hsl(var(--muted)) 10px,
            hsl(var(--background)) 10px,
            hsl(var(--background)) 20px
          )
        `,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={alt}
        className={`h-full w-full object-contain ${protectionEnabled ? "select-none" : ""}`}
        style={
          protectionEnabled
            ? { WebkitUserSelect: "none", userSelect: "none" }
            : {}
        }
        draggable={!protectionEnabled}
        onDragStart={handleDragStart}
      />
      {/* Transparent overlay to intercept clicks when protected */}
      {protectionEnabled && (
        <div className="absolute inset-0 z-[5]" aria-hidden="true" />
      )}
      {onExpand && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          className="absolute right-2 top-2 h-9 w-9 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
          aria-label="Expand image"
        >
          <Maximize2 className="h-5 w-5" />
        </Button>
      )}
      {/* Tags overlay */}
      {tags.length > 0 && (
        <div className="absolute bottom-2 right-2 flex flex-col gap-1.5">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
