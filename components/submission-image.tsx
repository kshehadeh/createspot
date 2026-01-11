"use client";

import { Button } from "@/components/ui/button";
import { getObjectPositionStyle } from "@/lib/image-utils";
import { Maximize2 } from "lucide-react";

interface SubmissionImageProps {
  imageUrl: string;
  alt: string;
  tags?: string[];
  /** Focal point for image cropping */
  imageFocalPoint?: { x: number; y: number } | null;
  /** Height classes for the container. Defaults to submission detail heights. */
  heightClasses?: string;
  /** Additional wrapper classes */
  className?: string;
  /** Callback when expand button is clicked */
  onExpand?: () => void;
}

export function SubmissionImage({
  imageUrl,
  alt,
  tags = [],
  imageFocalPoint,
  heightClasses = "h-[65vh] sm:h-[72vh] md:h-[80vh]",
  className = "",
  onExpand,
}: SubmissionImageProps) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl ${heightClasses} ${className} ${onExpand ? "cursor-pointer" : ""}`}
      onClick={onExpand}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={alt}
        className="h-full w-full object-cover"
        style={{ objectPosition: getObjectPositionStyle(imageFocalPoint) }}
      />
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
