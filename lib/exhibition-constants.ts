import type { LucideIcon } from "lucide-react";
import { Map, Signpost, Table } from "lucide-react";

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
    path: "/exhibition/gallery/grid",
    icon: Table,
  },
  constellation: {
    name: "Path",
    path: "/exhibition/gallery/path",
    icon: Signpost,
  },
  global: {
    name: "Map",
    path: "/exhibition/global",
    icon: Map,
  },
};
