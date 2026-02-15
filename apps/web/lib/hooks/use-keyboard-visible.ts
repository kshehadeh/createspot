import { useEffect, useState, useCallback } from "react";
import { useViewportHeight } from "./use-viewport-height";

/**
 * Hook to detect when the virtual keyboard is visible on mobile devices.
 *
 * Uses the VisualViewport API to accurately detect keyboard state and height.
 * This is essential for mobile modals that need to adjust their layout
 * when the on-screen keyboard appears.
 *
 * @returns Object with keyboard state information
 * @property {boolean} isKeyboardVisible - Whether the keyboard is currently visible
 * @property {number} keyboardHeight - Height of the keyboard in pixels
 * @property {number} viewportHeight - Current visible viewport height
 * @property {number} layoutViewportHeight - Full layout viewport height (before keyboard)
 *
 * @example
 * function MyModal() {
 *   const { isKeyboardVisible, keyboardHeight, viewportHeight } = useKeyboardVisible();
 *
 *   return (
 *     <div style={{ height: isKeyboardVisible ? `${viewportHeight}px` : '100dvh' }}>
 *       {/* Content that adjusts based on keyboard *}
 *     </div>
 *   );
 * }
 */
export function useKeyboardVisible() {
  const viewportHeight = useViewportHeight();
  const [layoutViewportHeight, setLayoutViewportHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // Set initial layout height when component mounts
    if (typeof window !== "undefined") {
      const initialHeight = window.innerHeight;
      setLayoutViewportHeight(initialHeight);

      // Threshold for detecting keyboard: consider keyboard visible if viewport
      // shrinks by more than 150px from initial
      const KEYBOARD_THRESHOLD = 150;

      const handleViewportChange = () => {
        const visualViewport = window.visualViewport;
        if (visualViewport) {
          const currentHeight = visualViewport.height;
          const heightDiff = initialHeight - currentHeight;

          const keyboardOpen = heightDiff > KEYBOARD_THRESHOLD;
          setIsKeyboardVisible(keyboardOpen);
          setKeyboardHeight(keyboardOpen ? heightDiff : 0);
        }
      };

      // Listen to visual viewport changes
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", handleViewportChange);
        window.visualViewport.addEventListener("scroll", handleViewportChange);

        // Check initial state
        handleViewportChange();

        return () => {
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
    }
  }, []); // Empty deps - only run on mount

  // Fallback: also detect keyboard by comparing current viewport to last known "full" height
  const checkKeyboardState = useCallback(() => {
    if (typeof window === "undefined") return;

    const currentHeight = window.innerHeight;
    const lastFullHeight = layoutViewportHeight || currentHeight;
    const heightDiff = lastFullHeight - currentHeight;

    // Consider keyboard visible if viewport shrinks by more than 150px
    const KEYBOARD_THRESHOLD = 150;
    const isKeyboard = heightDiff > KEYBOARD_THRESHOLD;

    if (isKeyboard !== isKeyboardVisible) {
      setIsKeyboardVisible(isKeyboard);
      setKeyboardHeight(isKeyboard ? heightDiff : 0);
    }
  }, [isKeyboardVisible, layoutViewportHeight]);

  // Also listen to focus/blur events on inputs as additional signal
  useEffect(() => {
    // Only add listeners on client side
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const handleFocusIn = (e: FocusEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        // Delay slightly to let keyboard appear
        setTimeout(checkKeyboardState, 100);
      }
    };

    const handleFocusOut = () => {
      // Delay slightly to let keyboard dismiss
      setTimeout(checkKeyboardState, 100);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, [checkKeyboardState]);

  return {
    isKeyboardVisible,
    keyboardHeight,
    viewportHeight,
    layoutViewportHeight,
  };
}
