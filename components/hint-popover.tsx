"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface HintPopoverProps {
  hintKey: string;
  page: string;
  title: string;
  description: string;
  targetSelector: string;
  side?: "top" | "right" | "bottom" | "left";
  shouldShow: boolean;
  order?: number;
}

export function HintPopover({
  hintKey,
  page,
  title,
  description,
  targetSelector,
  side = "bottom",
  shouldShow,
  order,
}: HintPopoverProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(shouldShow);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    let targetEl: Element | null = null;
    let mutationObserver: MutationObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const updatePosition = () => {
      if (!targetEl || !popoverRef.current) return false;

      const targetRect = targetEl.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY;
      const scrollLeft = window.scrollX;

      let top = 0;
      let left = 0;
      const gap = 12;

      switch (side) {
        case "bottom":
          top = targetRect.bottom + scrollTop + gap;
          left =
            targetRect.left +
            scrollLeft +
            (targetRect.width - popoverRect.width) / 2;
          break;
        case "top":
          top = targetRect.top + scrollTop - popoverRect.height - gap;
          left =
            targetRect.left +
            scrollLeft +
            (targetRect.width - popoverRect.width) / 2;
          break;
        case "right":
          top =
            targetRect.top +
            scrollTop +
            (targetRect.height - popoverRect.height) / 2;
          left = targetRect.right + scrollLeft + gap;
          break;
        case "left":
          top =
            targetRect.top +
            scrollTop +
            (targetRect.height - popoverRect.height) / 2;
          left = targetRect.left + scrollLeft - popoverRect.width - gap;
          break;
      }

      setPosition({ top, left });
      return true;
    };

    const setupObservers = (element: Element) => {
      // Clean up existing observers
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      // Set up MutationObserver to watch for DOM changes
      mutationObserver = new MutationObserver(() => {
        updatePosition();
      });

      // Observe changes to the target element and its parent
      mutationObserver.observe(element, {
        attributes: true, // Watch for attribute changes (e.g., class changes)
        childList: false, // Don't need to watch children of target
        subtree: false, // Don't watch subtree of target
      });

      // Also observe the parent container for structural changes
      const parent = element.parentElement;
      if (parent) {
        mutationObserver.observe(parent, {
          attributes: true,
          childList: true, // Watch for children being added/removed
          subtree: false,
        });
      }

      // Set up ResizeObserver to watch for size changes
      resizeObserver = new ResizeObserver(() => {
        updatePosition();
      });

      // Observe the target element
      resizeObserver.observe(element);

      // Also observe the parent if it exists
      if (parent) {
        resizeObserver.observe(parent);
      }
    };

    const findAndSetup = () => {
      const element = document.querySelector(targetSelector);
      if (!element) return false;

      targetEl = element;
      if (updatePosition()) {
        setupObservers(element);
        return true;
      }
      return false;
    };

    // Try to find the element immediately
    if (findAndSetup()) {
      // Element found, set up window listeners
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition);
      return () => {
        if (mutationObserver) mutationObserver.disconnect();
        if (resizeObserver) resizeObserver.disconnect();
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition);
      };
    }

    // Element not found yet, retry with exponential backoff
    let retryCount = 0;
    const maxRetries = 10;
    const retryInterval = 100; // Start with 100ms

    const retryTimer = setInterval(() => {
      retryCount++;
      if (findAndSetup()) {
        // Element found, set up listeners and clear retry
        clearInterval(retryTimer);
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition);
      } else if (retryCount >= maxRetries) {
        // Give up after max retries
        clearInterval(retryTimer);
        console.warn(
          `HintPopover: Could not find target element "${targetSelector}" after ${maxRetries} retries`,
        );
      }
    }, retryInterval);

    return () => {
      clearInterval(retryTimer);
      if (mutationObserver) mutationObserver.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isOpen, side, targetSelector]);

  const handleDismiss = async () => {
    setIsOpen(false);

    try {
      await fetch("/api/tutorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, hintKey, order }),
      });
      // Refresh the page to show the next hint in sequence
      router.refresh();
    } catch (error) {
      console.error("Failed to mark hint as seen:", error);
    }
  };

  if (!isOpen) return null;

  const getArrowStyles = () => {
    const arrowSize = 8;
    const borderWidth = 1;

    switch (side) {
      case "bottom":
        return {
          outer: {
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            borderLeft: `${arrowSize + borderWidth}px solid transparent`,
            borderRight: `${arrowSize + borderWidth}px solid transparent`,
            borderBottom: `${arrowSize + borderWidth}px solid hsl(var(--border))`,
          },
          inner: {
            bottom: "calc(100% - 1px)",
            left: "50%",
            transform: "translateX(-50%)",
            borderLeft: `${arrowSize}px solid transparent`,
            borderRight: `${arrowSize}px solid transparent`,
            borderBottom: `${arrowSize}px solid hsl(var(--popover))`,
          },
        };
      case "top":
        return {
          outer: {
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            borderLeft: `${arrowSize + borderWidth}px solid transparent`,
            borderRight: `${arrowSize + borderWidth}px solid transparent`,
            borderTop: `${arrowSize + borderWidth}px solid hsl(var(--border))`,
          },
          inner: {
            top: "calc(100% - 1px)",
            left: "50%",
            transform: "translateX(-50%)",
            borderLeft: `${arrowSize}px solid transparent`,
            borderRight: `${arrowSize}px solid transparent`,
            borderTop: `${arrowSize}px solid hsl(var(--popover))`,
          },
        };
      case "right":
        return {
          outer: {
            right: "100%",
            top: "50%",
            transform: "translateY(-50%)",
            borderTop: `${arrowSize + borderWidth}px solid transparent`,
            borderBottom: `${arrowSize + borderWidth}px solid transparent`,
            borderRight: `${arrowSize + borderWidth}px solid hsl(var(--border))`,
          },
          inner: {
            right: "calc(100% - 1px)",
            top: "50%",
            transform: "translateY(-50%)",
            borderTop: `${arrowSize}px solid transparent`,
            borderBottom: `${arrowSize}px solid transparent`,
            borderRight: `${arrowSize}px solid hsl(var(--popover))`,
          },
        };
      case "left":
        return {
          outer: {
            left: "100%",
            top: "50%",
            transform: "translateY(-50%)",
            borderTop: `${arrowSize + borderWidth}px solid transparent`,
            borderBottom: `${arrowSize + borderWidth}px solid transparent`,
            borderLeft: `${arrowSize + borderWidth}px solid hsl(var(--border))`,
          },
          inner: {
            left: "calc(100% - 1px)",
            top: "50%",
            transform: "translateY(-50%)",
            borderTop: `${arrowSize}px solid transparent`,
            borderBottom: `${arrowSize}px solid transparent`,
            borderLeft: `${arrowSize}px solid hsl(var(--popover))`,
          },
        };
    }
  };

  return (
    <div
      ref={popoverRef}
      style={{
        position: "fixed",
        top: position ? `${position.top}px` : "-9999px",
        left: position ? `${position.left}px` : "-9999px",
        zIndex: 50,
        visibility: position ? "visible" : "hidden",
      }}
      className="w-72 rounded-lg border border-border bg-popover text-popover-foreground shadow-md"
    >
      {/* Outer arrow (border) */}
      <div
        style={getArrowStyles()?.outer as React.CSSProperties}
        className="absolute w-0 h-0"
      />
      {/* Inner arrow (fill) */}
      <div
        style={getArrowStyles()?.inner as React.CSSProperties}
        className="absolute w-0 h-0"
      />
      <div className="relative space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm">{title}</h4>
          <button
            onClick={handleDismiss}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label="Close hint"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button
          size="sm"
          variant="default"
          onClick={handleDismiss}
          className="w-full"
        >
          Got it
        </Button>
      </div>
    </div>
  );
}
