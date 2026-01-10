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
