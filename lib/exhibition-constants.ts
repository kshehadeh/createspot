import type { LucideIcon } from "lucide-react";
import { Globe, Star, Palette } from "lucide-react";

export const EXHIBITION_PAGE_SIZE = 12;

export type ExhibitionType = "gallery" | "constellation" | "global";

export interface ExhibitionConfig {
  name: string;
  path: string;
  icon: LucideIcon;
}

export const EXHIBITION_CONFIGS: Record<ExhibitionType, ExhibitionConfig> = {
  gallery: {
    name: "Gallery",
    path: "/exhibition/gallery",
    icon: Palette,
  },
  constellation: {
    name: "Constellation",
    path: "/exhibition/constellation",
    icon: Star,
  },
  global: {
    name: "Global",
    path: "/exhibition/global",
    icon: Globe,
  },
};

/**
 * Get exhibition config by pathname
 */
export function getExhibitionByPath(pathname: string): ExhibitionConfig | null {
  if (
    pathname === "/exhibition/gallery" ||
    pathname.startsWith("/exhibition/gallery/")
  ) {
    return EXHIBITION_CONFIGS.gallery;
  }
  if (
    pathname === "/exhibition/constellation" ||
    pathname.startsWith("/exhibition/constellation/")
  ) {
    return EXHIBITION_CONFIGS.constellation;
  }
  if (
    pathname === "/exhibition/global" ||
    pathname.startsWith("/exhibition/global/")
  ) {
    return EXHIBITION_CONFIGS.global;
  }
  return null;
}
