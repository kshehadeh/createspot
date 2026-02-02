import {
  Camera,
  PenTool,
  Palette,
  PencilRuler,
  Layers,
  Layout,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

// Category to icon mapping
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Photography: Camera,
  Writing: PenTool,
  "Digital Art": Palette,
  Illustration: PencilRuler,
  "Mixed Media": Layers,
  Design: Layout,
  Other: HelpCircle,
};

/**
 * Get the icon component for a given category
 * @param category - The category name
 * @returns The Lucide icon component or null if no icon is found
 */
export function getCategoryIcon(category: string | null): LucideIcon | null {
  if (!category) return null;
  return CATEGORY_ICONS[category] || null;
}

/**
 * List of all available categories
 */
export const CATEGORIES = [
  "Photography",
  "Writing",
  "Digital Art",
  "Illustration",
  "Mixed Media",
  "Design",
  "Other",
] as const;
