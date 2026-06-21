import type { LucideIcon } from "lucide-react";
import { BookOpen, Map, Signpost, Table } from "lucide-react";

export const EXHIBITION_PAGE_SIZE = 12;

export type ExhibitionType =
  | "gallery"
  | "constellation"
  | "global"
  | "sketchbook";

export interface ExhibitionConfig {
  name: string;
  path: string;
  icon: LucideIcon;
}

export const EXHIBITION_CONFIGS: Record<ExhibitionType, ExhibitionConfig> = {
  gallery: {
    name: "Grid",
    path: "/inspire/exhibition/gallery/grid",
    icon: Table,
  },
  constellation: {
    name: "Path",
    path: "/inspire/exhibition/gallery/path",
    icon: Signpost,
  },
  sketchbook: {
    name: "Sketchbook",
    path: "/inspire/exhibition/gallery/sketchbook",
    icon: BookOpen,
  },
  global: {
    name: "Map",
    path: "/inspire/exhibition/global",
    icon: Map,
  },
};
