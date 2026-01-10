import type { LucideIcon } from "lucide-react";
import { Map, Star, Table } from "lucide-react";

export const EXHIBITION_PAGE_SIZE = 12;

export type ExhibitionType = "gallery" | "constellation" | "global";

export interface ExhibitionConfig {
  name: string;
  path: string;
  icon: LucideIcon;
}

export const EXHIBITION_CONFIGS: Record<ExhibitionType, ExhibitionConfig> = {
  gallery: {
    name: "Grid",
    path: "/exhibition/gallery",
    icon: Table,
  },
  constellation: {
    name: "Constellation",
    path: "/exhibition/constellation",
    icon: Star,
  },
  global: {
    name: "Map",
    path: "/exhibition/global",
    icon: Map,
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
