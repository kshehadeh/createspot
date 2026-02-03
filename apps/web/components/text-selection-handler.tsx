"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface TextSelectionHandlerProps {
  onSelectionComplete: (selection: {
    startIndex: number;
    endIndex: number;
    originalText: string;
  }) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

const MIN_TEXT_LENGTH = 3; // Minimum 3 characters

export function TextSelectionHandler({
  onSelectionComplete,
  disabled = false,
  children,
}: TextSelectionHandlerProps) {
  const t = useTranslations("critique");
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<{
    startIndex: number;
    endIndex: number;
    originalText: string;
  } | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleSelection = useCallback(() => {
    if (disabled) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setSelection(null);
      setShowButton(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();

    // Check minimum length
    if (selectedText.length < MIN_TEXT_LENGTH) {
      setSelection(null);
      setShowButton(false);
      return;
    }

    // Get the container element
    if (!containerRef.current) return;

    // Check if selection is within our container
    if (
      !containerRef.current.contains(range.commonAncestorContainer) &&
      !range.intersectsNode(containerRef.current)
    ) {
      setSelection(null);
      setShowButton(false);
      return;
    }

    // Create a range from start of container to start of selection
    const startRange = document.createRange();
    startRange.setStart(containerRef.current, 0);
    startRange.setEnd(range.startContainer, range.startOffset);
    const startIndex = startRange.toString().length;

    // Create a range from start of container to end of selection
    const endRange = document.createRange();
    endRange.setStart(containerRef.current, 0);
    endRange.setEnd(range.endContainer, range.endOffset);
    const endIndex = endRange.toString().length;

    if (startIndex === endIndex) {
      setSelection(null);
      setShowButton(false);
      return;
    }

    // Get button position (center of selection)
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    setButtonPosition({
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top - containerRect.top - 40,
    });

    setSelection({
      startIndex,
      endIndex,
      originalText: selectedText,
    });
    setShowButton(true);
  }, [disabled]);

  const handleCreateCritique = useCallback(() => {
    if (selection) {
      onSelectionComplete(selection);
      // Clear selection
      window.getSelection()?.removeAllRanges();
      setSelection(null);
      setShowButton(false);
    }
  }, [selection, onSelectionComplete]);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(e.target as Node)
    ) {
      window.getSelection()?.removeAllRanges();
      setSelection(null);
      setShowButton(false);
    }
  }, []);

  useEffect(() => {
    if (disabled) return;

    document.addEventListener("selectionchange", handleSelection);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("selectionchange", handleSelection);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [disabled, handleSelection, handleClickOutside]);

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="relative">
      {children}
      {showButton && selection && buttonPosition && (
        <div
          className="absolute z-50"
          style={{
            left: `${buttonPosition.x}px`,
            top: `${buttonPosition.y}px`,
            transform: "translateX(-50%)",
          }}
        >
          <Button
            size="sm"
            onClick={handleCreateCritique}
            className="shadow-lg"
          >
            {t("createCritiqueFromSelection")}
          </Button>
        </div>
      )}
    </div>
  );
}
