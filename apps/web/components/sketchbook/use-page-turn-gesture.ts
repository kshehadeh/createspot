"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useRef, useState } from "react";

type TurnDirection = "next" | "prev";

interface UsePageTurnGestureOptions {
  canTurnNext: boolean;
  canTurnPrevious: boolean;
  disabled?: boolean;
  thresholdPx?: number;
  onCommit: (direction: TurnDirection) => void;
}

interface UsePageTurnGestureResult {
  dragOffsetX: number;
  isDragging: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: () => void;
}

export function usePageTurnGesture({
  canTurnNext,
  canTurnPrevious,
  disabled = false,
  thresholdPx = 80,
  onCommit,
}: UsePageTurnGestureOptions): UsePageTurnGestureResult {
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const pointerRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);

  const reset = useCallback(() => {
    pointerRef.current = null;
    setDragOffsetX(0);
    setIsDragging(false);
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (disabled || event.button !== 0) return;

      pointerRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
      };
      setIsDragging(true);
      setDragOffsetX(0);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [disabled],
  );

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const currentPointer = pointerRef.current;
    if (!currentPointer || currentPointer.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - currentPointer.startX;
    const deltaY = event.clientY - currentPointer.startY;

    // Keep vertical scrolling natural unless horizontal intent is clear.
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      event.preventDefault();
    }

    setDragOffsetX(deltaX);
  }, []);

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const currentPointer = pointerRef.current;
      if (!currentPointer || currentPointer.pointerId !== event.pointerId)
        return;

      const deltaX = event.clientX - currentPointer.startX;
      const deltaY = event.clientY - currentPointer.startY;
      const horizontalIntent = Math.abs(deltaX) > Math.abs(deltaY);

      if (horizontalIntent && Math.abs(deltaX) >= thresholdPx) {
        if (deltaX < 0 && canTurnNext) {
          onCommit("next");
        }
        if (deltaX > 0 && canTurnPrevious) {
          onCommit("prev");
        }
      }

      reset();
    },
    [canTurnNext, canTurnPrevious, onCommit, reset, thresholdPx],
  );

  return {
    dragOffsetX,
    isDragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: reset,
  };
}
