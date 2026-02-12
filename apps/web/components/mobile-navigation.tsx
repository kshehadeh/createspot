"use client";

import Link from "next/link";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { signOut, signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "./ui/button";
import { SubmissionEditModal } from "./submission-edit-modal";
import { cn, getCreatorUrl } from "@/lib/utils";
import { getRoute } from "@/lib/routes";
import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Landmark,
  Users,
  User,
  Info,
  Briefcase,
  Heart,
  Lock,
  Sparkles,
  Mail,
  Plus,
  FolderOpen,
  Bug,
  Signpost,
  Palette,
} from "lucide-react";
import { SupportFormModal } from "./contact/support-form-modal";
import { ExhibitRequestModal } from "./contact/exhibit-request-form";
import { ThemeToggle } from "./theme-toggle";

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
}

export function MobileNavigation({
  user,
  onCreateModalOpen,
}: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isExhibitRequestModalOpen, setIsExhibitRequestModalOpen] =
    useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const t = useTranslations("navigation");

  // State for expandable sections
  const [exploreExpanded, setExploreExpanded] = useState(false);
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
    const promptRoute = getRoute("prompt");
    const profileRoute = getRoute("profile");
    const portfolioRoute = getRoute("portfolio");
    const favoritesRoute = getRoute("favorites");
    const adminRoute = getRoute("admin");
    const adminUsersRoute = getRoute("adminUsers");
    const adminPromptsRoute = getRoute("adminPrompts");
    const adminExhibitsRoute = getRoute("adminExhibits");
    const adminNotificationsRoute = getRoute("adminNotifications");
    const adminSettingsRoute = getRoute("adminSettings");
    const aboutRoute = getRoute("about");

    setExploreExpanded(
      pathname === exhibitionRoute.path ||
        pathname === creatorsRoute.path ||
        pathname === promptRoute.path ||
        pathname === getRoute("museums").path,
    );

    setMyHubExpanded(
      pathname.startsWith(profileRoute.path) ||
        pathname.startsWith(portfolioRoute.path) ||
        pathname.startsWith(favoritesRoute.path),
    );

    setAdminExpanded(
      pathname.startsWith(adminRoute.path) ||
        pathname.startsWith(adminUsersRoute.path) ||
        pathname.startsWith(adminPromptsRoute.path) ||
        pathname.startsWith(adminExhibitsRoute.path) ||
        pathname.startsWith(adminNotificationsRoute.path) ||
        pathname.startsWith(adminSettingsRoute.path),
    );

    setAboutExpanded(pathname.startsWith(aboutRoute.path));

    setUserExpanded(
      pathname.startsWith(profileRoute.path) ||
        pathname.startsWith(portfolioRoute.path) ||
        pathname.startsWith(favoritesRoute.path),
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
      {user && (
        <button
          onClick={handleCreateClick}
          className="flex items-center justify-center w-9 h-9 rounded-md text-foreground hover:bg-accent transition-colors md:hidden"
          aria-label={t("create")}
        >
          <span className="text-xl font-medium">+</span>
        </button>
      )}
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex flex-col gap-1.5 p-2 text-foreground md:hidden"
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
        className={`fixed right-0 top-0 z-50 h-full w-72 transform border-l border-border bg-background transition-transform duration-300 ease-in-out md:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Menu Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <span className="text-xl font-medium text-foreground font-permanent-marker">
              Create Spot
            </span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 text-muted-foreground hover:text-foreground"
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

          {/* Menu Content */}
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6">
            {/* Explore Section */}
            <MobileSection
              title={t("explore")}
              expanded={exploreExpanded}
              onToggle={() => setExploreExpanded(!exploreExpanded)}
              icon={Signpost}
            >
              <MobileNavItem
                href={getRoute("exhibition").path}
                icon={LayoutGrid}
                label={t("exhibits")}
                onClose={() => setIsMenuOpen(false)}
              />
              <MobileNavItem
                href={getRoute("museums").path}
                icon={Landmark}
                label={t("museums")}
                onClose={() => setIsMenuOpen(false)}
              />
              <MobileNavItem
                href={getRoute("creators").path}
                icon={Users}
                label={t("creators")}
                onClose={() => setIsMenuOpen(false)}
              />
              <MobileNavItem
                href={getRoute("prompt").path}
                icon={Sparkles}
                label={t("prompts")}
                onClose={() => setIsMenuOpen(false)}
              />
            </MobileSection>

            {/* My Hub Section (authenticated only) */}
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
                <div className="mt-0.5 border-t border-border" />
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
                    const isPortfolioActive =
                      pathname.startsWith(`${creatorBase}/portfolio`);
                    const isCollectionsActive =
                      pathname.startsWith(`${creatorBase}/collections`);
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
                <MobileNavItem
                  href={getRoute("community").path}
                  icon={Users}
                  label={t("community")}
                  onClose={() => setIsMenuOpen(false)}
                />
                <MobileNavItem
                  href={getRoute("favorites").path}
                  icon={Heart}
                  label={t("favorites")}
                  onClose={() => setIsMenuOpen(false)}
                />
              </MobileSection>
            )}

            {/* Admin Section (admin only) */}
            {user?.isAdmin && (
              <MobileSection
                title={t("admin")}
                expanded={adminExpanded}
                onToggle={() => setAdminExpanded(!adminExpanded)}
              >
                <MobileNavItem
                  href={getRoute("adminUsers").path}
                  icon={Users}
                  label={t("manageUsers")}
                  onClose={() => setIsMenuOpen(false)}
                />
                <MobileNavItem
                  href={getRoute("adminPrompts").path}
                  icon={Sparkles}
                  label={t("managePrompts")}
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
              <MobileNavActionItem
                icon={LayoutGrid}
                label={t("requestExhibit")}
                onClick={() => {
                  setIsExhibitRequestModalOpen(true);
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
              <MobileNavActionItem
                icon={Bug}
                label={t("submitBug")}
                onClick={() => {
                  setIsSupportModalOpen(true);
                  setIsMenuOpen(false);
                }}
              />
            </MobileSection>

            {/* User Section */}
            {user ? (
              <>
                <div className="mb-2 mt-auto border-t border-border pt-4">
                  <MobileSection
                    title={user.name || t("userAvatar")}
                    expanded={userExpanded}
                    onToggle={() => setUserExpanded(!userExpanded)}
                  >
                    <div className="flex items-center justify-center px-4 py-2">
                      <ThemeToggle />
                    </div>
                    <MobileNavActionItem
                      icon={Lock}
                      label={t("logout")}
                      onClick={handleLogout}
                    />
                  </MobileSection>
                </div>
              </>
            ) : (
              <div className="mt-auto border-t border-border pt-4 px-4">
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
    <div className="mb-2">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 text-left text-sm font-medium transition-colors rounded-lg hover:bg-accent text-foreground"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <span>{title}</span>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
          "flex items-center gap-3 px-4 py-3 text-sm transition-colors rounded-lg",
          "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
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
        "flex items-center gap-3 px-4 py-3 text-sm transition-colors rounded-lg",
        isActive
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
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
}: {
  icon: any;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 text-sm text-left text-muted-foreground transition-colors rounded-lg hover:bg-accent hover:text-accent-foreground w-full"
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}
