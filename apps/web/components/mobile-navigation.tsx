"use client";

import { Button } from "@createspot/ui-primitives/button";
import type { LucideIcon } from "lucide-react";
import {
  Brain,
  Briefcase,
  Bug,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Heart,
  HelpCircle,
  Info,
  LayoutDashboard,
  LayoutGrid,
  Lock,
  Mail,
  Palette,
  Pencil,
  Plus,
  ScrollText,
  User,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useRef, useState } from "react";
import Link from "@/components/link";
import { getRoute, isCreatorsListingPath } from "@/lib/routes";
import { cn, getCreatorUrl } from "@/lib/utils";
import { ExhibitRequestModal } from "./contact/exhibit-request-form";
import { SupportFormModal } from "./contact/support-form-modal";
import { SubmissionEditModal } from "./submission-edit-modal";

// Icon for Help link
function HelpIcon({ className }: { className?: string }) {
  return (
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
}

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isExhibitRequestModalOpen, setIsExhibitRequestModalOpen] =
    useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const tProfile = useTranslations("profile");
  const creatorsInspirePath = "/inspire/creators";

  // State for expandable sections
  const [inspireExpanded, setInspireExpanded] = useState(false);
  const [myHubExpanded, setMyHubExpanded] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [userExpanded, setUserExpanded] = useState(false);

  // Close menu when clicking outside
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

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Auto-expand sections based on current path
  useEffect(() => {
    const exhibitionRoute = getRoute("exhibition");
    const creatorsRoute = getRoute("creators");
    const profileRoute = getRoute("profile");
    const portfolioRoute = getRoute("portfolio");
    const favoritesRoute = getRoute("favorites");
    const adminRoute = getRoute("admin");
    const adminUsersRoute = getRoute("adminUsers");
    const adminExhibitsRoute = getRoute("adminExhibits");
    const adminNotificationsRoute = getRoute("adminNotifications");
    const adminSettingsRoute = getRoute("adminSettings");
    const aboutRoute = getRoute("about");

    setInspireExpanded(
      pathname === exhibitionRoute.path ||
        pathname === creatorsRoute.path ||
        pathname === creatorsInspirePath ||
        pathname === getRoute("community").path ||
        pathname === favoritesRoute.path,
    );

    setMyHubExpanded(
      pathname.startsWith(profileRoute.path) ||
        pathname.startsWith(portfolioRoute.path),
    );

    setAdminExpanded(
      pathname.startsWith(adminRoute.path) ||
        pathname.startsWith(adminUsersRoute.path) ||
        pathname.startsWith(adminExhibitsRoute.path) ||
        pathname.startsWith(adminNotificationsRoute.path) ||
        pathname.startsWith(adminSettingsRoute.path),
    );

    setAboutExpanded(pathname.startsWith(aboutRoute.path));

    setUserExpanded(
      pathname.startsWith(profileRoute.path) ||
        pathname.startsWith(portfolioRoute.path),
    );
  }, [pathname]);

  const handleCreateClick = () => {
    if (onCreateModalOpen) {
      onCreateModalOpen();
    }
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    signOut();
    setIsMenuOpen(false);
  };

  const handleSignIn = () => {
    signIn("google");
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Create Button */}
      {user && showCreateButton && (
        <button
          onClick={handleCreateClick}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-surface-bright/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          aria-label={t("create")}
        >
          <span className="text-xl font-medium">+</span>
        </button>
      )}
      {/* Mobile Hamburger Button */}
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

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-in Menu */}
      <div
        ref={menuRef}
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-80 transform bg-surface-container transition-transform duration-300 ease-in-out md:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Menu Header */}
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

          {/* Menu Content */}
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-5">
            {/* Inspire Section */}
            <MobileSection
              title={t("inspire")}
              expanded={inspireExpanded}
              onToggle={() => setInspireExpanded(!inspireExpanded)}
              icon={Brain}
            >
              <MobileNavItem
                href={getRoute("exhibition").path}
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
                href={getRoute("community").path}
                icon={Users}
                label={t("community")}
                onClose={() => setIsMenuOpen(false)}
              />
              {user && (
                <MobileNavItem
                  href={getRoute("favorites").path}
                  icon={Heart}
                  label={t("favorites")}
                  onClose={() => setIsMenuOpen(false)}
                />
              )}
            </MobileSection>

            {/* Create Section (authenticated only) */}
            {user && (
              <MobileSection
                title={t("myHub")}
                expanded={myHubExpanded}
                onToggle={() => setMyHubExpanded(!myHubExpanded)}
                icon={Palette}
              >
                <MobileNavActionItem
                  icon={Plus}
                  label={t("create")}
                  onClick={handleCreateClick}
                />
                <div className="mt-1 h-px bg-surface-bright/40" />
                <MobileNavItem
                  href={getRoute("dashboard").path}
                  icon={LayoutDashboard}
                  label={t("dashboard")}
                  onClose={() => setIsMenuOpen(false)}
                  isActive={pathname.startsWith(getRoute("dashboard").path)}
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
              </MobileSection>
            )}

            {/* Admin Section (admin only) */}
            {user?.isAdmin && (
              <MobileSection
                title={t("admin")}
                expanded={adminExpanded}
                onToggle={() => setAdminExpanded(!adminExpanded)}
                icon={Lock}
              >
                <MobileNavItem
                  href={getRoute("adminUsers").path}
                  icon={Users}
                  label={t("manageUsers")}
                  onClose={() => setIsMenuOpen(false)}
                />
                <MobileNavItem
                  href={getRoute("adminExhibits").path}
                  icon={LayoutGrid}
                  label={t("manageExhibits")}
                  onClose={() => setIsMenuOpen(false)}
                />
                <MobileNavItem
                  href={getRoute("adminNotifications").path}
                  icon={Mail}
                  label={t("manageNotifications")}
                  onClose={() => setIsMenuOpen(false)}
                />
                <MobileNavItem
                  href={getRoute("adminSettings").path}
                  icon={Lock}
                  label={t("siteSettings")}
                  onClose={() => setIsMenuOpen(false)}
                />
              </MobileSection>
            )}

            {/* Support Section */}
            <MobileSection
              title={t("support")}
              expanded={aboutExpanded}
              onToggle={() => setAboutExpanded(!aboutExpanded)}
              icon={HelpCircle}
            >
              <MobileNavItem
                href={getRoute("about").path}
                icon={Info}
                label={t("about")}
                onClose={() => setIsMenuOpen(false)}
              />
              <MobileNavItem
                href="https://help.create.spot"
                icon={HelpIcon}
                label={t("help")}
                isExternal
                onClose={() => setIsMenuOpen(false)}
              />
              <MobileNavItem
                href={getRoute("aboutChangelog").path}
                icon={ScrollText}
                label={t("updates")}
                onClose={() => setIsMenuOpen(false)}
              />
              <div className="my-2 h-px bg-surface-bright/40" aria-hidden />
              <MobileNavActionItem
                icon={LayoutGrid}
                label={t("requestExhibit")}
                labelClassName="bg-gradient-to-r from-amber-500 via-rose-500 to-violet-500 bg-clip-text font-bold text-transparent dark:from-amber-400 dark:via-rose-400 dark:to-violet-400"
                onClick={() => {
                  setIsExhibitRequestModalOpen(true);
                  setIsMenuOpen(false);
                }}
              />
              <div className="my-2 h-px bg-surface-bright/40" aria-hidden />
              <MobileNavActionItem
                icon={Bug}
                label={t("submitBug")}
                onClick={() => {
                  setIsSupportModalOpen(true);
                  setIsMenuOpen(false);
                }}
              />
              <MobileNavItem
                href="https://buymeacoffee.com/karimshehadeh"
                icon={Heart}
                label={t("buyMeACoffee")}
                isExternal
                onClose={() => setIsMenuOpen(false)}
              />
            </MobileSection>

            {/* User Section */}
            {user ? (
              <>
                <div className="mb-2 mt-auto pt-4">
                  <MobileSection
                    title={user.name || t("userAvatar")}
                    expanded={userExpanded}
                    onToggle={() => setUserExpanded(!userExpanded)}
                  >
                    {(() => {
                      const profileBase = user.id
                        ? getCreatorUrl({ id: user.id, slug: user.slug })
                        : user.slug
                          ? `/creators/${user.slug}`
                          : "";
                      const profileEditHref = profileBase
                        ? `${profileBase}/edit`
                        : "";
                      return profileBase ? (
                        <>
                          <MobileNavItem
                            href={profileBase}
                            icon={User}
                            label={tProfile("manageProfile")}
                            onClose={() => setIsMenuOpen(false)}
                          />
                          <MobileNavItem
                            href={profileEditHref}
                            icon={Pencil}
                            label={tProfile("edit")}
                            onClose={() => setIsMenuOpen(false)}
                          />
                        </>
                      ) : null;
                    })()}
                    <MobileNavActionItem
                      icon={Lock}
                      label={t("logout")}
                      onClick={handleLogout}
                    />
                  </MobileSection>
                </div>
              </>
            ) : (
              <div className="mt-auto pt-4 px-4">
                <Button
                  onClick={handleSignIn}
                  variant="default"
                  size="default"
                  className="w-full"
                >
                  {t("signIn")}
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>
      {user && (
        <SubmissionEditModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          mode="create"
        />
      )}
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

// Mobile Section Component (expandable)
function MobileSection({
  title,
  expanded,
  onToggle,
  icon: Icon,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="mb-2 rounded-xl bg-surface-container-high/60 p-1">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-bright/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-on-surface-variant" />}
          <span>{title}</span>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-on-surface-variant" />
        ) : (
          <ChevronRight className="h-4 w-4 text-on-surface-variant" />
        )}
      </button>
      {expanded && <div className="mt-1 space-y-0.5">{children}</div>}
    </div>
  );
}

// Mobile Navigation Item (link)
function MobileNavItem({
  href,
  icon: Icon,
  label,
  onClose,
  isExternal = false,
  isActive: isActiveProp,
}: {
  href: string;
  icon: any;
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
        : pathname === href || pathname.startsWith(href);

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
          ? "bg-surface-bright/70 text-foreground font-medium"
          : "text-on-surface-variant hover:bg-surface-bright/50 hover:text-foreground",
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}

// Mobile Navigation Action Item (button)
function MobileNavActionItem({
  icon: Icon,
  label,
  onClick,
  labelClassName,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  labelClassName?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-on-surface-variant transition-colors hover:bg-surface-bright/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className={cn(labelClassName)}>{label}</span>
    </button>
  );
}
