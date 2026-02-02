"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpandableBioProps {
  html: string;
  className?: string;
  maxHeight?: number;
}

export function ExpandableBio({
  html,
  className = "",
  maxHeight = 96,
}: ExpandableBioProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setNeedsExpansion(contentRef.current.scrollHeight > maxHeight);
    }
  }, [html, maxHeight]);

  return (
    <div className={className}>
      <div
        ref={contentRef}
        className={`prose prose-sm dark:prose-invert max-w-none text-muted-foreground overflow-hidden transition-[max-height] duration-300 ease-in-out ${
          isExpanded ? "" : ""
        }`}
        style={{
          maxHeight: isExpanded ? contentRef.current?.scrollHeight : maxHeight,
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {needsExpansion && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-auto p-0 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-transparent"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="mr-1 h-4 w-4" />
              Read less
            </>
          ) : (
            <>
              <ChevronDown className="mr-1 h-4 w-4" />
              Read more
            </>
          )}
        </Button>
      )}
    </div>
  );
}
