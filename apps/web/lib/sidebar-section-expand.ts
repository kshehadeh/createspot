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

/** True when `pathname` is exactly `base` or a nested route under it. */
export function isPathActive(base: string, pathname: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}
