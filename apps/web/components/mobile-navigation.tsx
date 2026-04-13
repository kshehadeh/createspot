"use client";

import {
  Brain,
  Briefcase,
  FolderOpen,
  Heart,
  Info,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Palette,
  Plus,
  Rss,
  Search,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import Link from "@/components/link";
import { useOptionalAppChrome } from "@/components/app-chrome-context";
import { buildRoutePath, getRoute, isCreatorsListingPath } from "@/lib/routes";
import {
  getDefaultSidebarNavMode,
  type SidebarNavMode,
} from "@/lib/sidebar-section-expand";
import { cn, getCreatorUrl } from "@/lib/utils";
import { Button } from "@createspot/ui-primitives/button";
import { SubmissionEditModal } from "./submission-edit-modal";

interface MobileNavigationUser {
  id?: string;
  slug?: string | null;
  name?: string | null;
  image?: string | null;
  profileImageUrl?: string | null;
  isAdmin?: boolean;
}

interface MobileNavigationProps {
  user?: MobileNavigationUser | null;
  onCreateModalOpen?: () => void;
  showCreateButton?: boolean;
}

export function MobileNavigation({
  user,
  onCreateModalOpen,
  showCreateButton = true,
}: MobileNavigationProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [navMode, setNavMode] = useState<SidebarNavMode>(() =>
    getDefaultSidebarNavMode(pathname, user),
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("navigation");
  const tProfile = useTranslations("profile");
  const creatorsInspirePath = "/inspire/creators";
  const chrome = useOptionalAppChrome();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isOutsideMenu =
        menuRef.current && !menuRef.current.contains(target);

      if (isMenuOpen && isOutsideMenu) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setNavMode(getDefaultSidebarNavMode(pathname, user));
  }, [pathname, user?.id, user?.slug]);

  const handleCreateClick = () => {
    if (chrome) {
      chrome.setCreateSubmissionOpen(true);
    } else {
      onCreateModalOpen?.();
      setIsCreateModalOpen(true);
    }
    setIsMenuOpen(false);
  };

  const openCommandPalette = () => {
    if (chrome) {
      setIsMenuOpen(false);
      chrome.setCommandOpen(true);
    }
  };

  const handleLogout = () => {
    signOut();
    setIsMenuOpen(false);
  };

  const feedRoute = getRoute("feed");
  const adminRoute = getRoute("admin");
  const aboutRoute = getRoute("about");
  const dashboardRoute = getRoute("dashboard");
  const exhibitionRoute = getRoute("exhibition");
  const communityRoute = getRoute("community");
  const favoritesRoute = getRoute("favorites");

  const segmentClass = (active: boolean) =>
    cn(
      "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      active
        ? "bg-surface-container-high text-foreground shadow-[0_8px_20px_rgb(0_0_0_/_0.2)]"
        : "text-on-surface-variant hover:bg-surface-bright/40 hover:text-foreground",
    );

  return (
    <>
      {user && showCreateButton && (
        <button
          onClick={handleCreateClick}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-surface-bright/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          aria-label={t("create")}
        >
          <span className="text-xl font-medium">+</span>
        </button>
      )}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex flex-col gap-1.5 rounded-xl p-2 text-foreground transition-colors hover:bg-surface-bright/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
        aria-label={t("toggleMenu")}
        aria-expanded={isMenuOpen}
      >
        <span
          className={`h-0.5 w-6 bg-foreground transition-all ${
            isMenuOpen ? "translate-y-2 rotate-45" : ""
          }`}
        />
        <span
          className={`h-0.5 w-6 bg-foreground transition-all ${
            isMenuOpen ? "opacity-0" : ""
          }`}
        />
        <span
          className={`h-0.5 w-6 bg-foreground transition-all ${
            isMenuOpen ? "-translate-y-2 -rotate-45" : ""
          }`}
        />
      </button>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <div
        ref={menuRef}
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-80 transform bg-surface-container transition-transform duration-300 ease-in-out md:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-b border-outline-variant/25 bg-surface-container-high px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xl font-medium text-foreground font-permanent-marker">
                Create Spot
              </span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="rounded-xl p-2 text-on-surface-variant hover:bg-surface-bright/60 hover:text-foreground"
                aria-label={t("closeMenu")}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <nav className="flex-1 overflow-y-auto px-4 py-4">
              <div className="mb-4 space-y-3">
                {user && (
                  <div
                    role="tablist"
                    aria-label={t("sidebarModeLabel")}
                    className="flex rounded-2xl border border-outline-variant/25 bg-surface-container-high/80 p-1"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={navMode === "create"}
                      className={segmentClass(navMode === "create")}
                      onClick={() => setNavMode("create")}
                    >
                      <Palette className="h-4 w-4 shrink-0" />
                      <span className="truncate">{t("myHub")}</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={navMode === "inspire"}
                      className={segmentClass(navMode === "inspire")}
                      onClick={() => setNavMode("inspire")}
                    >
                      <Brain className="h-4 w-4 shrink-0" />
                      <span className="truncate">{t("inspire")}</span>
                    </button>
                  </div>
                )}
                {chrome ? (
                  <button
                    type="button"
                    onClick={openCommandPalette}
                    aria-haspopup="dialog"
                    className="flex w-full items-center gap-3 rounded-full border border-outline-variant/25 bg-surface-container-high/90 px-4 py-3 text-left text-sm text-on-surface-variant transition-colors hover:bg-surface-bright/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    title={`${t("searchEverything")} (${t("searchEverythingShortcut")})`}
                  >
                    <Search className="h-4 w-4 shrink-0 opacity-70" />
                    <span className="truncate">{t("searchEverything")}</span>
                  </button>
                ) : null}
              </div>

              {user && navMode === "create" ? (
                <div className="space-y-0.5">
                  <MobileNavActionItem
                    icon={Plus}
                    label={t("create")}
                    onClick={handleCreateClick}
                  />
                  <MobileNavItem
                    href={dashboardRoute.path}
                    icon={LayoutDashboard}
                    label={t("dashboard")}
                    onClose={() => setIsMenuOpen(false)}
                    isActive={pathname.startsWith(dashboardRoute.path)}
                  />
                  {user.id &&
                    (() => {
                      const creatorBase = getCreatorUrl({
                        id: user.id,
                        slug: user.slug,
                      });
                      const isProfileActive =
                        pathname.startsWith(creatorBase) &&
                        !pathname.startsWith(`${creatorBase}/portfolio`) &&
                        !pathname.startsWith(`${creatorBase}/collections`);
                      const isPortfolioActive = pathname.startsWith(
                        `${creatorBase}/portfolio`,
                      );
                      const isCollectionsActive = pathname.startsWith(
                        `${creatorBase}/collections`,
                      );
                      return (
                        <>
                          <MobileNavItem
                            href={creatorBase}
                            icon={User}
                            label={t("profile")}
                            onClose={() => setIsMenuOpen(false)}
                            isActive={isProfileActive}
                          />
                          <MobileNavItem
                            href={`${creatorBase}/portfolio`}
                            icon={Briefcase}
                            label={t("portfolio")}
                            onClose={() => setIsMenuOpen(false)}
                            isActive={isPortfolioActive}
                          />
                          <MobileNavItem
                            href={`${creatorBase}/collections`}
                            icon={FolderOpen}
                            label={t("collections")}
                            onClose={() => setIsMenuOpen(false)}
                            isActive={isCollectionsActive}
                          />
                        </>
                      );
                    })()}
                </div>
              ) : (
                <div className="space-y-0.5">
                  <MobileNavItem
                    href={feedRoute.path}
                    icon={Rss}
                    label={t("feed")}
                    onClose={() => setIsMenuOpen(false)}
                    isActive={pathname === "/" || pathname === ""}
                  />
                  <MobileNavItem
                    href={exhibitionRoute.path}
                    icon={LayoutGrid}
                    label={t("exhibits")}
                    onClose={() => setIsMenuOpen(false)}
                  />
                  <MobileNavItem
                    href={creatorsInspirePath}
                    icon={Users}
                    label={t("creators")}
                    onClose={() => setIsMenuOpen(false)}
                    isActive={isCreatorsListingPath(pathname)}
                  />
                  <MobileNavItem
                    href={communityRoute.path}
                    icon={Users}
                    label={t("community")}
                    onClose={() => setIsMenuOpen(false)}
                  />
                  {user && (
                    <MobileNavItem
                      href={favoritesRoute.path}
                      icon={Heart}
                      label={t("favorites")}
                      onClose={() => setIsMenuOpen(false)}
                    />
                  )}
                </div>
              )}
            </nav>

            <div className="shrink-0 space-y-2 border-t border-outline-variant/25 px-4 py-4">
              {user?.isAdmin && (
                <MobileNavItem
                  href={adminRoute.path}
                  icon={LayoutDashboard}
                  label={t("administration")}
                  onClose={() => setIsMenuOpen(false)}
                  isActive={pathname.startsWith(adminRoute.path)}
                />
              )}
              <MobileNavItem
                href={aboutRoute.path}
                icon={Info}
                label={t("aboutButton")}
                onClose={() => setIsMenuOpen(false)}
                isActive={pathname.startsWith(aboutRoute.path)}
              />
              {user?.id ? (
                <>
                  <MobileNavItem
                    href={buildRoutePath("profile", { creatorid: user.id })}
                    icon={User}
                    label={tProfile("manageProfile")}
                    onClose={() => setIsMenuOpen(false)}
                  />
                  <MobileNavActionItem
                    icon={LogOut}
                    label={t("logout")}
                    onClick={handleLogout}
                  />
                </>
              ) : (
                <Button variant="default" className="w-full rounded-xl" asChild>
                  <Link
                    href="/welcome"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    {t("jumpIn")}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      {user && !chrome && (
        <SubmissionEditModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          mode="create"
        />
      )}
    </>
  );
}

function MobileNavItem({
  href,
  icon: Icon,
  label,
  onClose,
  isExternal = false,
  isActive: isActiveProp,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClose: () => void;
  isExternal?: boolean;
  isActive?: boolean;
}) {
  const pathname = usePathname();

  const isActive =
    isActiveProp !== undefined
      ? isActiveProp
      : isExternal
        ? false
        : href === "/"
          ? pathname === "/" || pathname === ""
          : pathname === href || pathname.startsWith(`${href}/`);

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors",
          "text-on-surface-variant hover:bg-surface-bright/50 hover:text-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
        {label}
      </a>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors",
        isActive
          ? "bg-surface-bright/70 font-medium text-foreground"
          : "text-on-surface-variant hover:bg-surface-bright/50 hover:text-foreground",
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}

function MobileNavActionItem({
  icon: Icon,
  label,
  onClick,
  labelClassName,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  labelClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-on-surface-variant transition-colors hover:bg-surface-bright/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className={cn(labelClassName)}>{label}</span>
    </button>
  );
}
