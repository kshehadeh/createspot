import { useEffect, useState } from "react";

/**
 * Hook to track the actual viewport height, accounting for mobile browser UI.
 *
 * On mobile browsers, the address bar and navigation controls can overlay
 * the viewport, making `100vh` larger than the actual visible area.
 * This hook tracks `window.innerHeight` which represents the true visible
 * viewport height.
 *
 * @returns The current viewport height in pixels
 *
 * @example
 * const viewportHeight = useViewportHeight();
 * <div style={{ height: `${viewportHeight}px` }}>Content</div>
 */
export function useViewportHeight(): number {
  const [height, setHeight] = useState(() => {
    if (typeof window === "undefined") {
      return 0;
    }
    return window.innerHeight;
  });

  useEffect(() => {
    const updateHeight = () => {
      setHeight(window.innerHeight);
    };

    // Set initial height
    updateHeight();

    // Listen for resize events (handles browser UI showing/hiding)
    window.addEventListener("resize", updateHeight);
    // Also listen for orientation changes
    window.addEventListener("orientationchange", updateHeight);

    // Use visualViewport API if available (more accurate on mobile)
    if (window.visualViewport) {
      const handleViewportChange = () => {
        setHeight(window.visualViewport?.height ?? window.innerHeight);
      };
      window.visualViewport.addEventListener("resize", handleViewportChange);
      window.visualViewport.addEventListener("scroll", handleViewportChange);

      return () => {
        window.removeEventListener("resize", updateHeight);
        window.removeEventListener("orientationchange", updateHeight);
        window.visualViewport?.removeEventListener(
          "resize",
          handleViewportChange,
        );
        window.visualViewport?.removeEventListener(
          "scroll",
          handleViewportChange,
        );
      };
    }

    return () => {
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("orientationchange", updateHeight);
    };
  }, []);

  return height;
}
