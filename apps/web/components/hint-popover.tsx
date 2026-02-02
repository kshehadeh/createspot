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
  targetSelector?: string;
  side?: "top" | "right" | "bottom" | "left";
  shouldShow: boolean;
  order?: number;
  showArrow?: boolean;
  fixedPosition?: {
    bottom?: number;
    right?: number;
    top?: number;
    left?: number;
  };
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
  showArrow = true,
  fixedPosition,
}: HintPopoverProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(shouldShow);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [useFallbackPosition, setUseFallbackPosition] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // If fixedPosition is provided, use it directly
    if (fixedPosition) {
      const top = fixedPosition.top ?? undefined;
      const left = fixedPosition.left ?? undefined;
      const bottom = fixedPosition.bottom ?? undefined;
      const right = fixedPosition.right ?? undefined;

      setPosition({
        top:
          top ??
          (bottom !== undefined
            ? window.innerHeight -
              (popoverRef.current?.offsetHeight ?? 0) -
              bottom
            : 0),
        left:
          left ??
          (right !== undefined
            ? window.innerWidth - (popoverRef.current?.offsetWidth ?? 0) - right
            : 0),
      });

      // Set up resize listener for fixed position hints
      const handleResize = () => {
        setPosition({
          top:
            top ??
            (bottom !== undefined
              ? window.innerHeight -
                (popoverRef.current?.offsetHeight ?? 0) -
                bottom
              : 0),
          left:
            left ??
            (right !== undefined
              ? window.innerWidth -
                (popoverRef.current?.offsetWidth ?? 0) -
                right
              : 0),
        });
      };

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }

    // Target-based positioning (existing logic)
    if (!targetSelector) {
      console.warn(
        "HintPopover: targetSelector is required when fixedPosition is not provided",
      );
      return;
    }

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

    /**
     * Check if an element is actually visible (not just present in DOM)
     * Elements can be hidden via CSS (display: none, visibility: hidden, etc.)
     */
    const isElementVisible = (element: Element): boolean => {
      if (!(element instanceof HTMLElement)) return false;

      // Check bounding box - if width/height are 0, element is likely hidden
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;

      // Check computed styles
      const style = window.getComputedStyle(element);
      if (style.display === "none") return false;
      if (style.visibility === "hidden") return false;
      if (style.opacity === "0") return false;

      // Check if element is within viewport (at least partially)
      const isInViewport =
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0;

      return isInViewport;
    };

    const findAndSetup = () => {
      const element = document.querySelector(targetSelector);
      if (!element) return false;

      // Check if element is actually visible
      if (!isElementVisible(element)) return false;

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
      window.addEventListener("scroll", updatePosition, { passive: true });
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
        window.addEventListener("scroll", updatePosition, { passive: true });
      } else if (retryCount >= maxRetries) {
        // Give up after max retries - fall back to fixed position (Did You Know style)
        clearInterval(retryTimer);
        const element = document.querySelector(targetSelector);
        if (element && !isElementVisible(element)) {
          console.warn(
            `HintPopover: Target element "${targetSelector}" exists but is not visible (likely hidden on mobile). Falling back to fixed position.`,
          );
        } else {
          console.warn(
            `HintPopover: Could not find or make visible target element "${targetSelector}" after ${maxRetries} retries. Falling back to fixed position.`,
          );
        }
        setUseFallbackPosition(true);
      }
    }, retryInterval);

    return () => {
      clearInterval(retryTimer);
      if (mutationObserver) mutationObserver.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isOpen, side, targetSelector, fixedPosition]);

  // Reset fallback position when targetSelector changes
  useEffect(() => {
    setUseFallbackPosition(false);
  }, [targetSelector]);

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

  // Determine if we should use fixed position (either explicitly provided or fallback)
  const effectiveFixedPosition = useFallbackPosition
    ? { bottom: 24, right: 24 }
    : fixedPosition;

  const positionStyle: React.CSSProperties = effectiveFixedPosition
    ? {
        position: "fixed",
        ...(effectiveFixedPosition.top !== undefined && {
          top: `${effectiveFixedPosition.top}px`,
        }),
        ...(effectiveFixedPosition.left !== undefined && {
          left: `${effectiveFixedPosition.left}px`,
        }),
        ...(effectiveFixedPosition.bottom !== undefined && {
          bottom: `${effectiveFixedPosition.bottom}px`,
        }),
        ...(effectiveFixedPosition.right !== undefined && {
          right: `${effectiveFixedPosition.right}px`,
        }),
        zIndex: 50,
      }
    : {
        position: "fixed",
        top: position ? `${position.top}px` : "-9999px",
        left: position ? `${position.left}px` : "-9999px",
        zIndex: 50,
        visibility: position ? "visible" : "hidden",
      };

  return (
    <div
      ref={popoverRef}
      style={positionStyle}
      className="w-72 rounded-lg border border-border bg-popover text-popover-foreground shadow-md"
    >
      {/* Outer arrow (border) */}
      {showArrow && !useFallbackPosition && (
        <div
          style={getArrowStyles()?.outer as React.CSSProperties}
          className="absolute w-0 h-0"
        />
      )}
      {/* Inner arrow (fill) */}
      {showArrow && !useFallbackPosition && (
        <div
          style={getArrowStyles()?.inner as React.CSSProperties}
          className="absolute w-0 h-0"
        />
      )}
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
