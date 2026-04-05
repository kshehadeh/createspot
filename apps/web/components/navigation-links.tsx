"use client";

import { useState } from "react";
import Link from "@/components/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { getRoute, isCreatorsListingPath } from "@/lib/routes";
import { cn, getCreatorUrl } from "@/lib/utils";
import { SupportFormModal } from "@/components/contact/support-form-modal";
import { ExhibitRequestModal } from "@/components/contact/exhibit-request-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@createspot/ui-primitives/dropdown-menu";
import {
  Brain,
  Bug,
  ChevronDown,
  FileText,
  Heart,
  HelpCircle,
  LayoutDashboard,
  LayoutGrid,
  Lock,
  Mail,
  Palette,
  Plus,
  FolderOpen,
  ScrollText,
} from "lucide-react";

interface DashboardNavigationProps {
  user?: {
    id?: string | undefined;
    slug?: string | null;
    isAdmin?: boolean | undefined;
  } | null;
  onCreateModalOpen?: () => void;
}

export function DashboardNavigation({
  user,
  onCreateModalOpen,
}: DashboardNavigationProps) {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isExhibitRequestModalOpen, setIsExhibitRequestModalOpen] =
    useState(false);
  const exhibitionRoute = getRoute("exhibition");
  const museumsRoute = getRoute("museums");
  const creatorsRoute = getRoute("creators");
  const profileRoute = getRoute("profile");
  const dashboardRoute = getRoute("dashboard");
  const portfolioRoute = getRoute("portfolio");
  const communityRoute = getRoute("community");
  const favoritesRoute = getRoute("favorites");
  const aboutRoute = getRoute("about");
  const changelogRoute = getRoute("aboutChangelog");
  const termsRoute = getRoute("terms");
  const adminUsersRoute = getRoute("adminUsers");
  const adminExhibitsRoute = getRoute("adminExhibits");
  const adminNotificationsRoute = getRoute("adminNotifications");
  const adminSettingsRoute = getRoute("adminSettings");

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const creatorBase = user?.id
    ? getCreatorUrl({
        id: user.id,
        slug: user.slug,
      })
    : null;
  const isInspireActive =
    isActive(exhibitionRoute.path) ||
    isActive(museumsRoute.path) ||
    isCreatorsListingPath(pathname) ||
    isActive(communityRoute.path) ||
    (user ? isActive(favoritesRoute.path) : false);
  const isMyHubActive =
    isActive(dashboardRoute.path) ||
    (creatorBase
      ? pathname.startsWith(creatorBase)
      : isActive(profileRoute.path) || isActive(portfolioRoute.path));
  const isAdminActive =
    pathname.startsWith(adminUsersRoute.path) ||
    pathname.startsWith(adminExhibitsRoute.path) ||
    pathname.startsWith(adminNotificationsRoute.path) ||
    pathname.startsWith(adminSettingsRoute.path);
  const isSupportActive = isActive(aboutRoute.path);

  const buttonClassName = () => {
    return cn(
      "flex h-9 items-center gap-2 rounded-lg px-3 text-sm transition-colors whitespace-nowrap",
      "text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    );
  };

  const handleCreateClick = () => {
    onCreateModalOpen?.();
  };

  return (
    <>
      <nav className="flex items-center gap-1">
        {/* Inspire Dropdown */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            className={cn(
              buttonClassName(),
              isInspireActive && "bg-accent text-accent-foreground",
            )}
          >
            <Brain className="h-4 w-4" />
            <span>{t("inspire")}</span>
            <ChevronDown className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-52">
            <DropdownMenuItem asChild>
              <Link
                href={exhibitionRoute.path}
                prefetch={false}
                className={cn(
                  "flex items-center gap-2",
                  isActive(exhibitionRoute.path) &&
                    "bg-accent text-accent-foreground",
                )}
              >
                {exhibitionRoute.icon && (
                  <exhibitionRoute.icon className="h-4 w-4" />
                )}
                {t("exhibits")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={museumsRoute.path}
                prefetch={false}
                className={cn(
                  "flex items-center gap-2",
                  isActive(museumsRoute.path) &&
                    "bg-accent text-accent-foreground",
                )}
              >
                {museumsRoute.icon && <museumsRoute.icon className="h-4 w-4" />}
                {t("museums")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={creatorsRoute.path}
                prefetch={false}
                className={cn(
                  "flex items-center gap-2",
                  isCreatorsListingPath(pathname) &&
                    "bg-accent text-accent-foreground",
                )}
              >
                {creatorsRoute.icon && (
                  <creatorsRoute.icon className="h-4 w-4" />
                )}
                {t("creators")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={communityRoute.path}
                prefetch={false}
                className={cn(
                  "flex items-center gap-2",
                  isActive(communityRoute.path) &&
                    "bg-accent text-accent-foreground",
                )}
              >
                {communityRoute.icon && (
                  <communityRoute.icon className="h-4 w-4" />
                )}
                {t("community")}
              </Link>
            </DropdownMenuItem>
            {user && (
              <DropdownMenuItem asChild>
                <Link
                  href={favoritesRoute.path}
                  prefetch={false}
                  className={cn(
                    "flex items-center gap-2",
                    isActive(favoritesRoute.path) &&
                      "bg-accent text-accent-foreground",
                  )}
                >
                  {favoritesRoute.icon && (
                    <favoritesRoute.icon className="h-4 w-4" />
                  )}
                  {t("favorites")}
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Create Dropdown (authenticated only) */}
        {user && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              className={cn(
                buttonClassName(),
                isMyHubActive && "bg-accent text-accent-foreground",
              )}
            >
              <Palette className="h-4 w-4" />
              <span>{t("myHub")}</span>
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-52">
              <DropdownMenuItem
                onClick={handleCreateClick}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t("create")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={dashboardRoute.path}
                  prefetch={false}
                  className={cn(
                    "flex items-center gap-2",
                    isActive(dashboardRoute.path) &&
                      "bg-accent text-accent-foreground",
                  )}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t("dashboard")}
                </Link>
              </DropdownMenuItem>
              {user.id &&
                (() => {
                  if (!creatorBase) return null;
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
                      <DropdownMenuItem asChild>
                        <Link
                          href={creatorBase}
                          prefetch={false}
                          className={cn(
                            "flex items-center gap-2",
                            isProfileActive &&
                              "bg-accent text-accent-foreground",
                          )}
                        >
                          {profileRoute.icon && (
                            <profileRoute.icon className="h-4 w-4" />
                          )}
                          {t("profile")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`${creatorBase}/portfolio`}
                          prefetch={false}
                          className={cn(
                            "flex items-center gap-2",
                            isPortfolioActive &&
                              "bg-accent text-accent-foreground",
                          )}
                        >
                          {portfolioRoute.icon && (
                            <portfolioRoute.icon className="h-4 w-4" />
                          )}
                          {t("portfolio")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`${creatorBase}/collections`}
                          prefetch={false}
                          className={cn(
                            "flex items-center gap-2",
                            isCollectionsActive &&
                              "bg-accent text-accent-foreground",
                          )}
                        >
                          <FolderOpen className="h-4 w-4" />
                          {t("collections")}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  );
                })()}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Admin Dropdown (admin only) */}
        {user?.isAdmin && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              className={cn(
                buttonClassName(),
                isAdminActive && "bg-accent text-accent-foreground",
              )}
            >
              <Lock className="h-4 w-4" />
              <span>{t("admin")}</span>
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-52">
              <DropdownMenuItem asChild>
                <Link
                  href={adminUsersRoute.path}
                  prefetch={false}
                  className={cn(
                    "flex items-center gap-2",
                    pathname.startsWith(adminUsersRoute.path) &&
                      "bg-accent text-accent-foreground",
                  )}
                >
                  {creatorsRoute.icon && (
                    <creatorsRoute.icon className="h-4 w-4" />
                  )}
                  {t("manageUsers")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={adminExhibitsRoute.path}
                  prefetch={false}
                  className={cn(
                    "flex items-center gap-2",
                    pathname.startsWith(adminExhibitsRoute.path) &&
                      "bg-accent text-accent-foreground",
                  )}
                >
                  {exhibitionRoute.icon && (
                    <exhibitionRoute.icon className="h-4 w-4" />
                  )}
                  {t("manageExhibits")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={adminNotificationsRoute.path}
                  prefetch={false}
                  className={cn(
                    "flex items-center gap-2",
                    pathname.startsWith(adminNotificationsRoute.path) &&
                      "bg-accent text-accent-foreground",
                  )}
                >
                  <Mail className="h-4 w-4" />
                  {t("manageNotifications")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={adminSettingsRoute.path}
                  prefetch={false}
                  className={cn(
                    "flex items-center gap-2",
                    pathname.startsWith(adminSettingsRoute.path) &&
                      "bg-accent text-accent-foreground",
                  )}
                >
                  {adminSettingsRoute.icon && (
                    <adminSettingsRoute.icon className="h-4 w-4" />
                  )}
                  {t("siteSettings")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Support Dropdown */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            className={cn(
              buttonClassName(),
              isSupportActive && "bg-accent text-accent-foreground",
            )}
          >
            <HelpCircle className="h-4 w-4" />
            <span>{t("support")}</span>
            <ChevronDown className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-52">
            <DropdownMenuItem asChild>
              <Link
                href={aboutRoute.path}
                prefetch={false}
                className={cn(
                  "flex items-center gap-2",
                  isActive(aboutRoute.path) &&
                    "bg-accent text-accent-foreground",
                )}
              >
                {aboutRoute.icon && <aboutRoute.icon className="h-4 w-4" />}
                {t("about")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={changelogRoute.path}
                prefetch={false}
                className={cn(
                  "flex items-center gap-2",
                  isActive(changelogRoute.path) &&
                    "bg-accent text-accent-foreground",
                )}
              >
                <ScrollText className="h-4 w-4" />
                {t("updates")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={termsRoute.path}
                prefetch={false}
                className={cn(
                  "flex items-center gap-2",
                  isActive(termsRoute.path) &&
                    "bg-accent text-accent-foreground",
                )}
              >
                <FileText className="h-4 w-4" />
                {t("terms")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href="https://help.create.spot"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2"
              >
                <HelpIcon className="h-4 w-4" />
                {t("help")}
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsExhibitRequestModalOpen(true)}
              className="flex items-center gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              {t("requestExhibit")}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href="https://buymeacoffee.com/karimshehadeh"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2"
              >
                <Heart className="h-4 w-4" />
                {t("buyMeACoffee")}
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsSupportModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Bug className="h-4 w-4" />
              {t("submitBug")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
      <SupportFormModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
      <ExhibitRequestModal
        isOpen={isExhibitRequestModalOpen}
        onClose={() => setIsExhibitRequestModalOpen(false)}
      />
    </>
  );
}

// Icon for Help link
const HelpIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);
