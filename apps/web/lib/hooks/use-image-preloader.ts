"use client";

import { useEffect } from "react";

/**
 * Preloads image URLs into the browser cache using Image objects.
 * When the user navigates to a preloaded URL (e.g. in a lightbox), the image
 * displays immediately. Safe to pass null/undefined URLs.
 */
export function useImagePreloader(urls: (string | null | undefined)[]): void {
  const key = JSON.stringify(urls.filter(Boolean));
  useEffect(() => {
    const images: HTMLImageElement[] = [];
    for (const url of urls) {
      if (url) {
        const img = new Image();
        img.src = url;
        images.push(img);
      }
    }
    return () => {
      for (const img of images) {
        img.src = "";
      }
    };
  }, [key]);
}
