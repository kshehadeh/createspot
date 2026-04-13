import { getCreatorUrl } from "@/lib/utils";
import { getRoute } from "@/lib/routes";

/** Minimal user shape for path-based sidebar section expansion (desktop + mobile drawer). */
export interface SidebarExpandUser {
  id?: string;
  slug?: string | null;
}

/**
 * Whether the Inspire nav block should default to expanded for `pathname`.
 * Shared by desktop sidebar and mobile drawer so behavior stays aligned.
 */
export function getInspireSectionExpandedForPath(pathname: string): boolean {
  const creatorsRoute = getRoute("creators");
  return (
    pathname === "/" ||
    pathname === "" ||
    pathname.startsWith("/inspire") ||
    pathname === creatorsRoute.path
  );
}

/**
 * Whether the Create / My hub block should default to expanded for `pathname`.
 * Shared by desktop sidebar and mobile drawer.
 */
export function getCreateSectionExpandedForPath(
  pathname: string,
  user: SidebarExpandUser | null | undefined,
): boolean {
  if (user?.id == null) return false;
  const dashboardPath = getRoute("dashboard").path;
  const creatorBase = getCreatorUrl({ id: user.id, slug: user.slug });
  return pathname.startsWith(dashboardPath) || pathname.startsWith(creatorBase);
}

export type SidebarNavMode = "create" | "inspire";

/**
 * Default Create vs Inspire tab for the sidebar/drawer from the current route.
 * Create wins when the user is signed in and the path is under dashboard or their creator hub.
 */
export function getDefaultSidebarNavMode(
  pathname: string,
  user: SidebarExpandUser | null | undefined,
): SidebarNavMode {
  return getCreateSectionExpandedForPath(pathname, user) ? "create" : "inspire";
}

/** True when `pathname` is exactly `base` or a nested route under it. */
export function isPathActive(base: string, pathname: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}
