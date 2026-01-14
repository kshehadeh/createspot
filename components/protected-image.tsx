"use client";

import { useCallback } from "react";
import Image, { type ImageProps } from "next/image";

type NextImageProps = Omit<ImageProps, "onContextMenu" | "onDragStart">;

interface ProtectedImageProps extends NextImageProps {
  /** Whether download protection is enabled. Default: true */
  protectionEnabled?: boolean;
  /** Additional class names for the wrapper div */
  wrapperClassName?: string;
  /** Whether to use native img tag instead of Next.js Image. Default: false */
  useNativeImg?: boolean;
}

/**
 * A protected image component that prevents casual downloading.
 * 
 * Protection measures:
 * - Disables right-click context menu
 * - Prevents drag-and-drop
 * - Disables text/image selection
 * - Adds transparent overlay to intercept interactions
 * 
 * Note: These are deterrents, not absolute protection. Determined users
 * can still use dev tools or screenshot functionality.
 */
export function ProtectedImage({
  protectionEnabled = true,
  wrapperClassName = "",
  useNativeImg = false,
  className = "",
  alt,
  src,
  ...props
}: ProtectedImageProps) {
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

  const protectedStyles: React.CSSProperties = protectionEnabled
    ? {
        WebkitUserSelect: "none",
        userSelect: "none",
        WebkitTouchCallout: "none",
        pointerEvents: "none",
      }
    : {};

  const imageClassName = `${className} ${protectionEnabled ? "select-none" : ""}`.trim();

  if (useNativeImg) {
    return (
      <div
        className={`protected-image-wrapper relative ${wrapperClassName}`}
        onContextMenu={handleContextMenu}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={typeof src === "string" ? src : ""}
          alt={alt}
          className={imageClassName}
          style={protectedStyles}
          draggable={!protectionEnabled}
          onDragStart={handleDragStart}
          {...(props as React.ImgHTMLAttributes<HTMLImageElement>)}
        />
        {/* Transparent overlay to intercept clicks/touches */}
        {protectionEnabled && (
          <div
            className="absolute inset-0 z-10"
            aria-hidden="true"
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={`protected-image-wrapper relative ${wrapperClassName}`}
      onContextMenu={handleContextMenu}
    >
      <Image
        src={src}
        alt={alt}
        className={imageClassName}
        style={protectedStyles}
        draggable={!protectionEnabled}
        onDragStart={handleDragStart}
        {...props}
      />
      {/* Transparent overlay to intercept clicks/touches */}
      {protectionEnabled && (
        <div
          className="absolute inset-0 z-10"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/**
 * A simpler protected native img element for use in lightboxes
 * where Next.js Image optimization is not needed.
 */
interface ProtectedNativeImgProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Whether download protection is enabled. Default: true */
  protectionEnabled?: boolean;
}

export function ProtectedNativeImg({
  protectionEnabled = true,
  className = "",
  style,
  ...props
}: ProtectedNativeImgProps) {
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

  const protectedStyles: React.CSSProperties | undefined = protectionEnabled
    ? {
        ...style,
        WebkitUserSelect: "none",
        userSelect: "none",
        WebkitTouchCallout: "none",
      }
    : style;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`${className} ${protectionEnabled ? "select-none" : ""}`.trim()}
      style={protectedStyles}
      draggable={!protectionEnabled}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      {...props}
    />
  );
}
