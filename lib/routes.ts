import type { LucideIcon } from "lucide-react";
import type { getTranslations } from "next-intl/server";
import {
  Lock,
  Heart,
  User,
  Briefcase,
  LogOut,
  Users,
  LayoutGrid,
  Sparkles,
  Info,
  Mail,
  Settings,
} from "lucide-react";
import { EXHIBITION_CONFIGS } from "./exhibition-constants";
import { Home } from "lucide-react";

export interface RouteConfig {
  path: string;
  label: string; // Translation key (e.g., "navigation.home") or fallback text
  parentPath?: string;
  icon?: LucideIcon;
  isLink?: boolean; // If false, breadcrumb won't be a link (default: true)
}

/**
 * Translation function type - compatible with both server and client translations
 * Uses the return type of next-intl's getTranslations for proper type safety
 */
export type TranslationFunction = Awaited<ReturnType<typeof getTranslations>>;

/**
 * Centralized route configuration for the application.
 * Used for breadcrumbs, navigation, and route management.
 */
const ROUTES: Record<string, RouteConfig> = {
  // Home
  home: {
    path: "/",
    label: "navigation.home",
    icon: Home,
  },

  // Exhibition routes
  exhibition: {
    path: "/exhibition",
    label: "navigation.exhibits",
    isLink: false, // Root exhibit page is not a link in breadcrumbs
    icon: LayoutGrid,
  },
  exhibitionPermanent: {
    path: "/exhibition/permanent",
    label: "navigation.permanentCollection",
    parentPath: "/exhibition",
    // Note: This is a virtual route for breadcrumbs only - links to /exhibition
  },
  exhibitionGallery: {
    path: "/exhibition/gallery/grid",
    label: "navigation.grid",
    parentPath: "/exhibition/permanent",
    icon: EXHIBITION_CONFIGS.gallery.icon,
  },
  exhibitionConstellation: {
    path: "/exhibition/gallery/path",
    label: "navigation.constellation",
    parentPath: "/exhibition/permanent",
    icon: EXHIBITION_CONFIGS.constellation.icon,
  },
  exhibitionGlobal: {
    path: "/exhibition/global",
    label: "navigation.map",
    parentPath: "/exhibition/permanent",
    icon: EXHIBITION_CONFIGS.global.icon,
  },

  // Prompt routes
  prompt: {
    path: "/prompt",
    label: "navigation.prompts",
    isLink: false, // Root prompt page is not a link in breadcrumbs
    icon: Sparkles,
  },
  promptPlay: {
    path: "/prompt/play",
    label: "navigation.play",
    parentPath: "/prompt",
  },
  promptHistory: {
    path: "/prompt/history",
    label: "navigation.history",
    parentPath: "/prompt",
  },
  promptThisWeek: {
    path: "/prompt/this-week",
    label: "navigation.thisWeek",
    parentPath: "/prompt",
  },

  // Admin routes
  admin: {
    path: "/admin",
    label: "navigation.admin",
    isLink: false, // Root admin page is not a link in breadcrumbs
    icon: Lock,
  },
  adminPrompts: {
    path: "/admin/prompts",
    label: "navigation.prompts",
    parentPath: "/admin",
  },
  adminUsers: {
    path: "/admin/users",
    label: "navigation.users",
    parentPath: "/admin",
  },
  adminExhibits: {
    path: "/admin/exhibits",
    label: "navigation.exhibits",
    parentPath: "/admin",
  },
  adminExhibitsNew: {
    path: "/admin/exhibits/new",
    label: "navigation.new",
    parentPath: "/admin/exhibits",
  },
  adminNotifications: {
    path: "/admin/notifications",
    label: "navigation.notifications",
    parentPath: "/admin",
  },
  adminSettings: {
    path: "/admin/settings",
    label: "navigation.siteSettings",
    parentPath: "/admin",
    icon: Settings,
  },

  // Profile routes (now under creators/[creatorid])
  profile: {
    path: "/creators/[creatorid]",
    label: "navigation.profile",
    isLink: false,
    icon: User,
  },
  profileEdit: {
    path: "/creators/[creatorid]/edit",
    label: "navigation.edit",
    parentPath: "/creators/[creatorid]",
  },

  // Portfolio routes (now under creators/[creatorid]/portfolio)
  portfolio: {
    path: "/creators/[creatorid]/portfolio",
    label: "navigation.portfolio",
    icon: Briefcase,
    isLink: false,
  },
  portfolioEdit: {
    path: "/creators/[creatorid]/portfolio/edit",
    label: "navigation.edit",
    parentPath: "/creators/[creatorid]/portfolio",
  },
  submission: {
    path: "/creators/[creatorid]/s/[submissionid]",
    label: "navigation.submission",
    parentPath: "/creators/[creatorid]/portfolio",
  },
  submissionEdit: {
    path: "/creators/[creatorid]/s/[submissionid]/edit",
    label: "navigation.edit",
    parentPath: "/creators/[creatorid]/s/[submissionid]",
  },
  submissionImageEditor: {
    path: "/creators/[creatorid]/s/[submissionid]/edit/image",
    label: "navigation.imageEditor",
    parentPath: "/creators/[creatorid]/s/[submissionid]/edit",
  },

  // Collections routes (now under creators/[creatorid]/collections)
  collections: {
    path: "/creators/[creatorid]/collections",
    label: "navigation.collections",
    parentPath: "/creators/[creatorid]/portfolio",
  },

  // Short URL (share link redirect)
  shortUrl: {
    path: "/s/[code]",
    label: "navigation.share",
    isLink: false,
  },

  // Other routes
  creators: {
    path: "/creators",
    label: "navigation.creators",
    icon: Users,
  },
  favorites: {
    path: "/favorites",
    label: "navigation.favorites",
    icon: Heart,
  },
  about: {
    path: "/about",
    label: "navigation.about",
    isLink: false,
    icon: Info,
  },
  aboutPurpose: {
    path: "/about/purpose",
    label: "about.purpose.title",
    parentPath: "/about",
  },
  aboutFeatures: {
    path: "/about/features",
    label: "navigation.features",
    parentPath: "/about",
  },
  aboutPortfoliosAndSharing: {
    path: "/about/portfolios-and-sharing",
    label: "about.organization.title",
    parentPath: "/about",
  },
  aboutPromptSubmissions: {
    path: "/about/prompt-submissions",
    label: "about.promptInspiration.title",
    parentPath: "/about",
  },
  aboutBadges: {
    path: "/about/badges",
    label: "about.badges.title",
    parentPath: "/about",
  },
  aboutProtectingYourWork: {
    path: "/about/protecting-your-work",
    label: "about.protectingYourWork.title",
    parentPath: "/about",
  },
  aboutCritiques: {
    path: "/about/critiques",
    label: "navigation.critiques",
    parentPath: "/about",
  },
  contact: {
    path: "/contact",
    label: "navigation.contact",
    icon: Mail,
  },
  terms: {
    path: "/about/terms",
    label: "navigation.terms",
    parentPath: "/about",
  },
  logout: {
    path: "/logout",
    label: "navigation.logout",
    icon: LogOut,
  },
};

/**
 * Translate a route label using a translation function.
 * If the label is a translation key (contains a dot), it will be translated.
 * Otherwise, it returns the label as-is (fallback).
 *
 * Note: The translation function should be scoped to the namespace (e.g., getTranslations("navigation"))
 * and the label should be the full key (e.g., "navigation.home"). This function will extract
 * the key part after the namespace.
 */
function translateLabel(label: string, t?: TranslationFunction): string {
  if (!t) return label;

  // Check if label is a translation key (contains a dot)
  if (label.includes(".")) {
    try {
      // Extract the key part after the namespace (e.g., "home" from "navigation.home")
      const key = label.split(".").slice(1).join(".");
      return t(key);
    } catch {
      // If translation fails, return the key as fallback
      return label;
    }
  }

  // If not a translation key, return as-is
  return label;
}

/**
 * Translate a route configuration using a translation function.
 */
function translateRoute(
  route: RouteConfig,
  t?: TranslationFunction,
): RouteConfig {
  if (!t) return route;

  return {
    ...route,
    label: translateLabel(route.label, t),
  };
}

/**
 * Get route configuration by key
 */
export function getRoute(key: keyof typeof ROUTES): RouteConfig {
  return ROUTES[key];
}

/**
 * Build a route path by replacing dynamic segments with actual values.
 *
 * @param key - Route key from ROUTES
 * @param params - Object with parameter values to replace dynamic segments
 * @returns The actual path with parameters replaced
 *
 * @example
 * buildRoutePath("portfolio", { creatorid: "123" })
 * // Returns: "/creators/123/portfolio"
 *
 * buildRoutePath("profileEdit", { creatorid: "123" })
 * // Returns: "/creators/123/edit"
 */
export function buildRoutePath(
  key: keyof typeof ROUTES,
  params: Record<string, string>,
): string {
  const route = getRoute(key);
  let path = route.path;

  // Replace dynamic segments like [creatorid], [submissionid], etc.
  for (const [paramName, paramValue] of Object.entries(params)) {
    path = path.replace(`[${paramName}]`, paramValue);
  }

  return path;
}

/**
 * Get route configuration by path
 */
function getRouteByPath(path: string): RouteConfig | undefined {
  return Object.values(ROUTES).find((route) => route.path === path);
}

/**
 * Get translated route configuration by path
 */
export function getTranslatedRouteByPath(
  path: string,
  t?: TranslationFunction,
): RouteConfig | undefined {
  const route = getRouteByPath(path);
  return route ? translateRoute(route, t) : undefined;
}

/**
 * Build breadcrumb segments from a parent path using the route system.
 * When a route is used as a parent in a breadcrumb chain, it should be a link
 * even if isLink: false (that only applies when it's the final destination).
 *
 * @param parentPath - The parent path to build breadcrumbs from (e.g., "/profile")
 * @param additionalSegments - Additional segments to append (e.g., dynamic user name)
 * @param t - Optional translation function
 * @returns Array of breadcrumb segments
 */
export function buildBreadcrumbFromParent(
  parentPath: string,
  additionalSegments: Array<{
    label: string;
    href?: string;
    icon?: LucideIcon;
  }> = [],
  t?: TranslationFunction,
): Array<{ label: string; href?: string; icon?: LucideIcon }> {
  const segments: Array<{ label: string; href?: string; icon?: LucideIcon }> =
    [];
  const route = getRouteByPath(parentPath);

  if (route) {
    // Build breadcrumb chain by following parentPath
    let currentRoute: RouteConfig | undefined = route;
    const visited = new Set<string>();

    while (currentRoute) {
      if (visited.has(currentRoute.path)) {
        // Prevent infinite loops
        break;
      }
      visited.add(currentRoute.path);

      // When used as a parent in breadcrumbs, always make it a link
      // (isLink: false only applies when it's the final destination)
      // Special case: Permanent Collection links to /exhibition instead of /exhibition/permanent
      const href =
        currentRoute.path === "/exhibition/permanent"
          ? "/exhibition"
          : currentRoute.path;
      segments.unshift({
        label: translateLabel(currentRoute.label, t),
        href, // Always a link when used as parent
        icon: currentRoute.icon,
      });

      if (currentRoute.parentPath) {
        currentRoute = getRouteByPath(currentRoute.parentPath);
      } else {
        break;
      }
    }
  }

  // Add additional segments (these won't have hrefs if not provided)
  segments.push(...additionalSegments);

  // Ensure the last segment is never a link
  if (segments.length > 0) {
    const lastIndex = segments.length - 1;
    segments[lastIndex] = {
      ...segments[lastIndex],
      href: undefined,
    };
  }

  return segments;
}

/**
 * Get breadcrumb segments for a given pathname.
 * Returns null if no breadcrumbs should be shown.
 *
 * @param pathname - The pathname to build breadcrumbs for
 * @param t - Optional translation function
 * @returns Array of breadcrumb segments or null
 */
export function getBreadcrumbSegments(
  pathname: string,
  t?: TranslationFunction,
): Array<{ label: string; href?: string; icon?: LucideIcon }> | null {
  // Homepage - no breadcrumbs
  if (pathname === "/") return null;

  // Auth routes - no breadcrumbs
  if (pathname.startsWith("/auth")) return null;

  // Try to find exact match first
  const route = getRouteByPath(pathname);
  if (route) {
    const segments: Array<{ label: string; href?: string; icon?: LucideIcon }> =
      [];

    // Build breadcrumb chain by following parentPath
    let currentRoute: RouteConfig | undefined = route;
    const visited = new Set<string>();

    while (currentRoute) {
      if (visited.has(currentRoute.path)) {
        // Prevent infinite loops
        break;
      }
      visited.add(currentRoute.path);

      // Special case: Permanent Collection links to /exhibition instead of /exhibition/permanent
      const href =
        currentRoute.isLink !== false
          ? currentRoute.path === "/exhibition/permanent"
            ? "/exhibition"
            : currentRoute.path
          : undefined;
      segments.unshift({
        label: translateLabel(currentRoute.label, t),
        href,
        icon: currentRoute.icon,
      });

      if (currentRoute.parentPath) {
        currentRoute = getRouteByPath(currentRoute.parentPath);
      } else {
        break;
      }
    }

    // Ensure the last segment is never a link
    if (segments.length > 0) {
      const lastIndex = segments.length - 1;
      segments[lastIndex] = {
        ...segments[lastIndex],
        href: undefined,
      };
    }

    return segments.length > 0 ? segments : null;
  }

  // Short URL: /s/[code]
  const pathParts = pathname.split("/").filter(Boolean);
  if (pathParts[0] === "s" && pathParts.length === 2) {
    return [
      {
        label: t ? translateLabel("navigation.share", t) : "Share",
        href: undefined,
      },
    ];
  }

  // Handle dynamic routes and special cases
  if (pathname.startsWith("/exhibition/") && pathname !== "/exhibition") {
    // Dynamic exhibit routes like /exhibition/[id]
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && parts[0] === "exhibition") {
      return [
        {
          label: t ? translateLabel("navigation.exhibit", t) : "Exhibit",
          href: "/exhibition",
        },
        { label: parts[1] }, // Will be replaced by actual exhibit title in specific breadcrumb files
      ];
    }
  }

  if (pathname.startsWith("/about/")) {
    return [
      {
        label: t ? translateLabel("navigation.about", t) : "About",
        href: "/about",
      },
      {
        label: t ? translateLabel("navigation.details", t) : "Details",
      },
    ];
  }

  // Default fallback - try to generate from path segments
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0) {
    return segments.map((segment, index) => {
      const isLast = index === segments.length - 1;
      const path = "/" + segments.slice(0, index + 1).join("/");
      const route = getRouteByPath(path);

      // Capitalize first letter if no route found
      const label = route?.label
        ? translateLabel(route.label, t)
        : segment.charAt(0).toUpperCase() + segment.slice(1);
      const href = isLast
        ? undefined
        : route?.isLink !== false
          ? path
          : undefined;

      return { label, href, icon: route?.icon };
    });
  }

  return null;
}
