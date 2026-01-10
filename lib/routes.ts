import type { LucideIcon } from "lucide-react";
import { Lock, Heart, User, Briefcase, LogOut } from "lucide-react";
import { EXHIBITION_CONFIGS } from "./exhibition-constants";
import { Home } from "lucide-react";

export interface RouteConfig {
  path: string;
  label: string;
  parentPath?: string;
  icon?: LucideIcon;
  isLink?: boolean; // If false, breadcrumb won't be a link (default: true)
}

/**
 * Centralized route configuration for the application.
 * Used for breadcrumbs, navigation, and route management.
 */
const ROUTES: Record<string, RouteConfig> = {
  // Home
  home: {
    path: "/",
    label: "Home",
    icon: Home,
  },

  // Exhibition routes
  exhibition: {
    path: "/exhibition",
    label: "Exhibits",
    isLink: false, // Root exhibit page is not a link in breadcrumbs
  },
  exhibitionPermanent: {
    path: "/exhibition/permanent",
    label: "Permanent Collection",
    parentPath: "/exhibition",
    // Note: This is a virtual route for breadcrumbs only - links to /exhibition
  },
  exhibitionGallery: {
    path: "/exhibition/gallery",
    label: "Grid",
    parentPath: "/exhibition/permanent",
    icon: EXHIBITION_CONFIGS.gallery.icon,
  },
  exhibitionConstellation: {
    path: "/exhibition/constellation",
    label: "Constellation",
    parentPath: "/exhibition/permanent",
    icon: EXHIBITION_CONFIGS.constellation.icon,
  },
  exhibitionGlobal: {
    path: "/exhibition/global",
    label: "Map",
    parentPath: "/exhibition/permanent",
    icon: EXHIBITION_CONFIGS.global.icon,
  },

  // Prompt routes
  prompt: {
    path: "/prompt",
    label: "Prompts",
    isLink: false, // Root prompt page is not a link in breadcrumbs
  },
  promptPlay: {
    path: "/prompt/play",
    label: "Play",
    parentPath: "/prompt",
  },
  promptHistory: {
    path: "/prompt/history",
    label: "History",
    parentPath: "/prompt",
  },
  promptThisWeek: {
    path: "/prompt/this-week",
    label: "This Week",
    parentPath: "/prompt",
  },

  // Admin routes
  admin: {
    path: "/admin",
    label: "Admin",
    isLink: false, // Root admin page is not a link in breadcrumbs
    icon: Lock,
  },
  adminPrompts: {
    path: "/admin/prompts",
    label: "Prompts",
    parentPath: "/admin",
  },
  adminUsers: {
    path: "/admin/users",
    label: "Users",
    parentPath: "/admin",
  },
  adminExhibits: {
    path: "/admin/exhibits",
    label: "Exhibits",
    parentPath: "/admin",
  },
  adminExhibitsNew: {
    path: "/admin/exhibits/new",
    label: "New",
    parentPath: "/admin/exhibits",
  },

  // Profile routes
  profile: {
    path: "/profile",
    label: "Profile",
    isLink: false,
    icon: User,
  },
  profileEdit: {
    path: "/profile/edit",
    label: "Edit",
    parentPath: "/profile",
  },

  // Portfolio routes
  portfolio: {
    path: "/portfolio",
    label: "Portfolio",
    icon: Briefcase,
    isLink: false,
  },
  portfolioEdit: {
    path: "/portfolio/edit",
    label: "Edit",
    parentPath: "/portfolio",
  },

  // Other routes
  favorites: {
    path: "/favorites",
    label: "Favorites",
    icon: Heart,
  },
  about: {
    path: "/about",
    label: "About",
    isLink: false,
  },
  logout: {
    path: "/logout",
    label: "Logout",
    icon: LogOut,
  },
};

/**
 * Get route configuration by key
 */
export function getRoute(key: keyof typeof ROUTES): RouteConfig {
  return ROUTES[key];
}

/**
 * Get route configuration by path
 */
export function getRouteByPath(path: string): RouteConfig | undefined {
  return Object.values(ROUTES).find((route) => route.path === path);
}

/**
 * Build breadcrumb segments from a parent path using the route system.
 * When a route is used as a parent in a breadcrumb chain, it should be a link
 * even if isLink: false (that only applies when it's the final destination).
 *
 * @param parentPath - The parent path to build breadcrumbs from (e.g., "/profile")
 * @param additionalSegments - Additional segments to append (e.g., dynamic user name)
 * @returns Array of breadcrumb segments
 */
export function buildBreadcrumbFromParent(
  parentPath: string,
  additionalSegments: Array<{
    label: string;
    href?: string;
    icon?: LucideIcon;
  }> = [],
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
        label: currentRoute.label,
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
 */
export function getBreadcrumbSegments(
  pathname: string,
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
        label: currentRoute.label,
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

  // Handle dynamic routes and special cases
  if (pathname.startsWith("/exhibition/") && pathname !== "/exhibition") {
    // Dynamic exhibit routes like /exhibition/[id]
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && parts[0] === "exhibition") {
      return [
        { label: "Exhibit", href: "/exhibition" },
        { label: parts[1] }, // Will be replaced by actual exhibit title in specific breadcrumb files
      ];
    }
  }

  if (pathname.startsWith("/about/")) {
    return [{ label: "About", href: "/about" }, { label: "Details" }];
  }

  // Default fallback - try to generate from path segments
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0) {
    return segments.map((segment, index) => {
      const isLast = index === segments.length - 1;
      const path = "/" + segments.slice(0, index + 1).join("/");
      const route = getRouteByPath(path);

      // Capitalize first letter if no route found
      const label =
        route?.label || segment.charAt(0).toUpperCase() + segment.slice(1);
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
