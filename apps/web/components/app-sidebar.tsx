"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "@/components/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import {
  Brain,
  Briefcase,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Heart,
  Info,
  LayoutDashboard,
  LayoutGrid,
  Palette,
  PanelLeftClose,
  PanelRightClose,
  Plus,
  Rss,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@createspot/ui-primitives/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@createspot/ui-primitives/avatar";
import { Button } from "@createspot/ui-primitives/button";
import { CreateSpotLogo } from "@/components/create-spot-logo";
import { SubmissionEditModal } from "@/components/submission-edit-modal";
import { useAppChrome } from "@/components/app-chrome-context";
import { cn, getCreatorUrl } from "@/lib/utils";
import { buildRoutePath, getRoute, isCreatorsListingPath } from "@/lib/routes";
import { isFullWidthSubmissionPath } from "@/lib/app-chrome-paths";
import {
  getCreateSectionExpandedForPath,
  getInspireSectionExpandedForPath,
  isPathActive,
} from "@/lib/sidebar-section-expand";
import { getUserImageUrl } from "@/lib/user-image";

interface AppSidebarUser {
  id?: string;
  slug?: string | null;
  name?: string | null;
  image?: string | null;
  profileImageUrl?: string | null;
  isAdmin?: boolean;
}

interface AppSidebarProps {
  user?: AppSidebarUser | null;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const tNav = useTranslations("navigation");
  const tCreator = useTranslations("creatorNav");
  const { sidebarCollapsed, toggleSidebarCollapsed } = useAppChrome();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createExpanded, setCreateExpanded] = useState(() =>
    getCreateSectionExpandedForPath(pathname, user),
  );
  const [inspireExpanded, setInspireExpanded] = useState(() =>
    getInspireSectionExpandedForPath(pathname),
  );

  const hideChrome = isFullWidthSubmissionPath(pathname);

  const exhibitionRoute = getRoute("exhibition");
  const communityRoute = getRoute("community");
  const favoritesRoute = getRoute("favorites");
  const dashboardRoute = getRoute("dashboard");
  const feedRoute = getRoute("feed");
  const adminRoute = getRoute("admin");
  const aboutRoute = getRoute("about");
  const creatorsInspirePath = "/inspire/creators";

  const creatorBase = user?.id
    ? getCreatorUrl({ id: user.id, slug: user.slug })
    : null;

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors",
      sidebarCollapsed ? "justify-center px-2" : "px-3",
      active
        ? "bg-surface-container-high text-foreground shadow-[0_10px_24px_rgb(0_0_0_/_0.24)]"
        : "text-on-surface-variant hover:bg-surface-container-high hover:text-foreground",
    );

  const isActivePath = useCallback(
    (path: string) => {
      if (path === "/") return pathname === "/" || pathname === "";
      return pathname === path || pathname.startsWith(`${path}/`);
    },
    [pathname],
  );

  useEffect(() => {
    setInspireExpanded(getInspireSectionExpandedForPath(pathname));
    setCreateExpanded(getCreateSectionExpandedForPath(pathname, user));
  }, [pathname, user?.id, user?.slug]);

  if (hideChrome) {
    return null;
  }

  const renderCreateLinks = () => (
    <ul className="space-y-2">
      <li>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className={linkClass(false)}
          title={tNav("create")}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && (
            <span className="truncate">{tNav("create")}</span>
          )}
        </button>
      </li>
      <li>
        <Link
          href={dashboardRoute.path}
          className={linkClass(isActivePath(dashboardRoute.path))}
          title={tNav("dashboard")}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && (
            <span className="truncate">{tNav("dashboard")}</span>
          )}
        </Link>
      </li>
      {creatorBase && (
        <>
          <li>
            <Link
              href={creatorBase}
              className={linkClass(
                pathname === creatorBase || pathname === `${creatorBase}/edit`,
              )}
              title={tCreator("profile")}
            >
              <User className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && (
                <span className="truncate">{tCreator("profile")}</span>
              )}
            </Link>
          </li>
          <li>
            <Link
              href={`${creatorBase}/portfolio`}
              className={linkClass(
                pathname.startsWith(`${creatorBase}/portfolio`),
              )}
              title={tCreator("portfolio")}
            >
              <Briefcase className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && (
                <span className="truncate">{tCreator("portfolio")}</span>
              )}
            </Link>
          </li>
          <li>
            <Link
              href={`${creatorBase}/collections`}
              className={linkClass(
                pathname.startsWith(`${creatorBase}/collections`),
              )}
              title={tCreator("collections")}
            >
              <FolderOpen className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && (
                <span className="truncate">{tCreator("collections")}</span>
              )}
            </Link>
          </li>
        </>
      )}
    </ul>
  );

  const renderInspireLinks = () => (
    <ul className="space-y-2">
      <li>
        <Link
          href={feedRoute.path}
          className={linkClass(pathname === "/" || pathname === "")}
          title={tNav("feed")}
        >
          <Rss className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && (
            <span className="truncate">{tNav("feed")}</span>
          )}
        </Link>
      </li>
      <li>
        <Link
          href={exhibitionRoute.path}
          className={linkClass(
            pathname === exhibitionRoute.path ||
              pathname.startsWith(`${exhibitionRoute.path}/`),
          )}
          title={tNav("exhibits")}
        >
          <LayoutGrid className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && (
            <span className="truncate">{tNav("exhibits")}</span>
          )}
        </Link>
      </li>
      <li>
        <Link
          href={creatorsInspirePath}
          className={linkClass(isCreatorsListingPath(pathname))}
          title={tNav("creators")}
        >
          <Users className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && (
            <span className="truncate">{tNav("creators")}</span>
          )}
        </Link>
      </li>
      <li>
        <Link
          href={communityRoute.path}
          className={linkClass(isPathActive(communityRoute.path, pathname))}
          title={tNav("community")}
        >
          <Users className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && (
            <span className="truncate">{tNav("community")}</span>
          )}
        </Link>
      </li>
      {user && (
        <li>
          <Link
            href={favoritesRoute.path}
            className={linkClass(isPathActive(favoritesRoute.path, pathname))}
            title={tNav("favorites")}
          >
            <Heart className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && (
              <span className="truncate">{tNav("favorites")}</span>
            )}
          </Link>
        </li>
      )}
    </ul>
  );

  return (
    <>
      <aside
        className={cn(
          "sticky top-0 z-20 hidden h-screen shrink-0 flex-col bg-background pl-3 transition-[width] duration-200 ease-out md:pl-4",
          sidebarCollapsed ? "w-[4.5rem]" : "w-64",
          "md:flex",
        )}
      >
        <div className="flex h-full min-h-0 flex-col py-3 md:py-4">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-surface-container shadow-[0_14px_35px_rgb(0_0_0_/_0.35)]">
            <div
              className={cn(
                "shrink-0 border-b border-outline-variant/20 px-3 pb-3 pt-4 md:px-4",
                sidebarCollapsed && "flex justify-center px-2 pb-3 pt-4",
              )}
            >
              <Link
                href={getRoute("home").path}
                className={cn(
                  "flex min-w-0 items-center gap-2 text-foreground",
                  sidebarCollapsed && "justify-center",
                )}
                title="Create Spot"
              >
                <CreateSpotLogo
                  className="h-7 w-auto shrink-0"
                  base="currentColor"
                  highlight="rgb(161 161 170)"
                />
                {!sidebarCollapsed && (
                  <span className="truncate font-permanent-marker text-lg tracking-tight">
                    Create Spot
                  </span>
                )}
              </Link>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3">
              {sidebarCollapsed ? (
                <div className="space-y-5">
                  {user && renderCreateLinks()}
                  {renderInspireLinks()}
                </div>
              ) : (
                <div className="space-y-2">
                  {user && (
                    <SidebarSection
                      title={tNav("myHub")}
                      icon={Palette}
                      expanded={createExpanded}
                      onToggle={() => setCreateExpanded((v) => !v)}
                    >
                      {renderCreateLinks()}
                    </SidebarSection>
                  )}
                  <SidebarSection
                    title={tNav("inspire")}
                    icon={Brain}
                    expanded={inspireExpanded}
                    onToggle={() => setInspireExpanded((v) => !v)}
                  >
                    {renderInspireLinks()}
                  </SidebarSection>
                </div>
              )}
            </nav>

            {/* Pinned bottom: Admin, About, user */}
            <div className="shrink-0 space-y-2 border-t border-outline-variant/25 p-3">
              {user?.isAdmin && (
                <Link
                  href={adminRoute.path}
                  className={linkClass(pathname.startsWith(adminRoute.path))}
                  title={tNav("administration")}
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="truncate">{tNav("administration")}</span>
                  )}
                </Link>
              )}
              <Link
                href={aboutRoute.path}
                className={linkClass(isActivePath(aboutRoute.path))}
                title={tNav("aboutButton")}
              >
                <Info className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && (
                  <span className="truncate">{tNav("aboutButton")}</span>
                )}
              </Link>
              {user ? (
                <SidebarUserMenu user={user} collapsed={sidebarCollapsed} />
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className={cn(
                    "w-full rounded-xl",
                    sidebarCollapsed && "size-9 p-0",
                  )}
                  asChild
                >
                  <Link
                    href="/welcome"
                    title={tNav("jumpIn")}
                    className={cn(
                      "flex items-center justify-center gap-2",
                      sidebarCollapsed && "p-0",
                    )}
                  >
                    <Sparkles className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="truncate">{tNav("jumpIn")}</span>
                    )}
                  </Link>
                </Button>
              )}
            </div>

            <div className="shrink-0 border-t border-outline-variant/20 p-2">
              <button
                type="button"
                onClick={toggleSidebarCollapsed}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-high py-2.5 text-on-surface-variant transition-colors hover:bg-surface-bright/50 hover:text-foreground"
                aria-expanded={!sidebarCollapsed}
                aria-label={
                  sidebarCollapsed
                    ? tNav("expandSidebar")
                    : tNav("collapseSidebar")
                }
                title={
                  sidebarCollapsed
                    ? tNav("expandSidebar")
                    : tNav("collapseSidebar")
                }
              >
                {sidebarCollapsed ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <>
                    <PanelLeftClose className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      {tNav("collapseSidebar")}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {user && (
        <SubmissionEditModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          mode="create"
        />
      )}
    </>
  );
}

function SidebarSection({
  title,
  icon: Icon,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: LucideIcon;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-surface-container-high/60 p-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-bright/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-on-surface-variant" />
          <span className="truncate">{title}</span>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-on-surface-variant" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-on-surface-variant" />
        )}
      </button>
      {expanded && <div className="mt-1 px-0.5">{children}</div>}
    </div>
  );
}

function SidebarUserMenu({
  user,
  collapsed,
}: {
  user: AppSidebarUser;
  collapsed: boolean;
}) {
  const tNav = useTranslations("navigation");
  const tProfile = useTranslations("profile");
  const [mounted, setMounted] = useState(false);
  const logoutRoute = getRoute("logout");

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayImage = getUserImageUrl(user.profileImageUrl, user.image);

  if (!mounted || !user.id) {
    return (
      <div
        className={cn(
          "flex h-10 items-center gap-2 rounded-xl px-2",
          collapsed && "justify-center",
        )}
      >
        <div className="h-8 w-8 shrink-0 rounded-full bg-surface-bright" />
        {!collapsed && (
          <span className="truncate text-sm text-foreground">
            {user.name ?? "…"}
          </span>
        )}
      </div>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm text-foreground outline-none transition-colors hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-ring",
          collapsed && "justify-center px-0",
        )}
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage
            src={displayImage || undefined}
            alt={user.name || "User"}
          />
          <AvatarFallback className="bg-surface-bright text-sm font-medium">
            {user.name?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate font-medium">
              {user.name ?? tNav("userAvatar")}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-on-surface-variant" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="min-w-[12rem]">
        <DropdownMenuItem asChild>
          <Link
            href={buildRoutePath("profile", { creatorid: user.id })}
            className="flex items-center"
          >
            <User className="mr-2 h-4 w-4" />
            {tProfile("manageProfile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut()}>
          {logoutRoute.icon && <logoutRoute.icon className="mr-2 h-4 w-4" />}
          {tNav("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
