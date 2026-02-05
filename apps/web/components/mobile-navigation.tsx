"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, startTransition } from "react";
import { usePathname } from "next/navigation";
import { signOut, signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "./ui/button";
import { SubmissionEditModal } from "./submission-edit-modal";
import { cn, getCreatorUrl } from "@/lib/utils";
import { getRoute } from "@/lib/routes";
import { getUserImageUrl } from "@/lib/user-image";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  ChevronLeft,
  Bug,
  HelpCircle,
} from "lucide-react";
import { SupportFormModal } from "./contact/support-form-modal";

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
}

export function MobileNavigation({ user }: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPromptsSidebarOpen, setIsPromptsSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const promptsSidebarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const t = useTranslations("navigation");

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isOutsideMenu =
        menuRef.current && !menuRef.current.contains(target);
      const isOutsidePromptsSidebar =
        promptsSidebarRef.current &&
        !promptsSidebarRef.current.contains(target);

      if (isMenuOpen && isOutsideMenu && isOutsidePromptsSidebar) {
        setIsMenuOpen(false);
      }
      if (isPromptsSidebarOpen && isOutsidePromptsSidebar && isOutsideMenu) {
        setIsPromptsSidebarOpen(false);
      }
    }

    if (isMenuOpen || isPromptsSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isMenuOpen, isPromptsSidebarOpen]);

  // Close menu on route change
  useEffect(() => {
    startTransition(() => {
      setIsMenuOpen(false);
      setIsPromptsSidebarOpen(false);
    });
  }, [pathname]);

  return (
    <>
      {/* Mobile Create Button */}
      {user && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
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
      {(isMenuOpen || isPromptsSidebarOpen) && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => {
            setIsMenuOpen(false);
            setIsPromptsSidebarOpen(false);
          }}
        />
      )}

      {/* Mobile Slide-in Menu */}
      <div
        ref={menuRef}
        className={`fixed right-0 top-0 z-50 h-full w-64 transform border-l border-border bg-background transition-transform duration-300 ease-in-out md:hidden ${
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
            <MobileNavigationLinks
              onLinkClick={() => setIsMenuOpen(false)}
              onMoreClick={() => setIsPromptsSidebarOpen(true)}
            />
            {user ? (
              <>
                <div className="mb-2 mt-auto border-t border-border pt-4 px-4">
                  <Button
                    onClick={() => {
                      setIsCreateModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    variant="outline"
                    size="default"
                    className="w-full flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {t("create")}
                  </Button>
                </div>
                <MobileUserSection
                  user={user}
                  onActionClick={() => setIsMenuOpen(false)}
                />
              </>
            ) : (
              <div className="mt-auto border-t border-border pt-4 px-4">
                <Button
                  onClick={() => {
                    signIn("google");
                    setIsMenuOpen(false);
                  }}
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

      {/* Secondary Sidebar for Prompts */}
      <div
        ref={promptsSidebarRef}
        className={`fixed right-0 top-0 z-[60] h-full w-64 transform border-l border-border bg-background transition-transform duration-300 ease-in-out md:hidden ${
          isPromptsSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <button
              onClick={() => setIsPromptsSidebarOpen(false)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              aria-label={t("closeMenu")}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="text-base font-medium">{t("more")}</span>
            </button>
            <button
              onClick={() => {
                setIsPromptsSidebarOpen(false);
                setIsMenuOpen(false);
              }}
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

          {/* Sidebar Content */}
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6">
            <MobilePromptsLinks
              onLinkClick={() => {
                setIsPromptsSidebarOpen(false);
                setIsMenuOpen(false);
              }}
              onSupportClick={() => {
                setIsSupportModalOpen(true);
                setIsPromptsSidebarOpen(false);
                setIsMenuOpen(false);
              }}
            />
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
    </>
  );
}

// Mobile Navigation Links Component
function MobileNavigationLinks({
  onLinkClick,
  onMoreClick,
}: {
  isAuthenticated?: boolean;
  isAdmin?: boolean;
  onLinkClick: () => void;
  onMoreClick: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const exhibitionRoute = getRoute("exhibition");
  const creatorsRoute = getRoute("creators");
  const aboutRoute = getRoute("about");

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const linkClassName = (path: string) => {
    const baseClasses =
      "block px-4 py-3 text-base font-medium transition-colors rounded-lg";
    const activeClasses = isActive(path)
      ? "bg-accent text-accent-foreground"
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground";
    return `${baseClasses} ${activeClasses}`;
  };
  return (
    <>
      <div className="mb-2">
        <Link
          href={exhibitionRoute.path}
          className={cn(
            linkClassName(exhibitionRoute.path),
            "flex items-center gap-2",
          )}
          onClick={onLinkClick}
        >
          {exhibitionRoute.icon && <exhibitionRoute.icon className="h-5 w-5" />}
          {t("exhibits")}
        </Link>
      </div>
      <div className="mb-2">
        <Link
          href={creatorsRoute.path}
          className={cn(
            linkClassName(creatorsRoute.path),
            "flex items-center gap-2",
          )}
          onClick={onLinkClick}
        >
          {creatorsRoute.icon && <creatorsRoute.icon className="h-5 w-5" />}
          {t("creators")}
        </Link>
      </div>
      <div className="mb-2">
        <Link
          href={aboutRoute.path}
          className={cn(
            linkClassName(aboutRoute.path),
            "flex items-center gap-2",
          )}
          onClick={onLinkClick}
        >
          {aboutRoute.icon && <aboutRoute.icon className="h-5 w-5" />}
          {t("about")}
        </Link>
      </div>
      <div className="mb-2">
        <button
          onClick={onMoreClick}
          className={cn(
            "block w-full px-4 py-3 text-base font-medium transition-colors rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            "flex items-center gap-2",
          )}
        >
          {t("more")}
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </>
  );
}

// Mobile Prompts Links Component (for secondary sidebar)
function MobilePromptsLinks({
  onLinkClick,
  onSupportClick,
}: {
  onLinkClick: () => void;
  onSupportClick: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const tSupport = useTranslations("contact.support");
  const promptRoute = getRoute("prompt");
  const contactRoute = getRoute("contact");

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const linkClassName = (path: string) => {
    const baseClasses =
      "block px-4 py-3 text-base font-medium transition-colors rounded-lg";
    const activeClasses = isActive(path)
      ? "bg-accent text-accent-foreground"
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground";
    return `${baseClasses} ${activeClasses}`;
  };

  return (
    <>
      <div className="mb-2">
        <Link
          href={promptRoute.path}
          className={cn(
            linkClassName(promptRoute.path),
            "flex items-center gap-2",
          )}
          onClick={onLinkClick}
        >
          {promptRoute.icon && <promptRoute.icon className="h-5 w-5" />}
          {t("prompts")}
        </Link>
      </div>
      <div className="mb-2">
        <a
          href="https://help.create.spot"
          target="_blank"
          rel="noreferrer"
          className={cn(
            "block px-4 py-3 text-base font-medium transition-colors rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            "flex items-center gap-2",
          )}
          onClick={onLinkClick}
        >
          <HelpCircle className="h-5 w-5" />
          {t("help")}
        </a>
      </div>
      <div className="mt-auto border-t border-border pt-4">
        <div className="mb-2">
          <button
            onClick={() => {
              onSupportClick();
              onLinkClick();
            }}
            className={cn(
              "block w-full px-4 py-3 text-base font-medium transition-colors rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              "flex items-center gap-2",
            )}
          >
            <Bug className="h-5 w-5" />
            {tSupport("cta")}
          </button>
        </div>
        <div className="mb-2">
          <Link
            href={contactRoute.path}
            className={cn(
              linkClassName(contactRoute.path),
              "flex items-center gap-2",
            )}
            onClick={onLinkClick}
          >
            {contactRoute.icon && <contactRoute.icon className="h-5 w-5" />}
            {t("contact")}
          </Link>
        </div>
      </div>
    </>
  );
}

// Mobile User Section Component
function MobileUserSection({
  user,
  onActionClick,
}: {
  user: MobileNavigationUser;
  onActionClick: () => void;
}) {
  const pathname = usePathname();
  const [isUserOpen, setIsUserOpen] = useState(false);
  const t = useTranslations("navigation");
  const profileRoute = getRoute("profile");
  const portfolioRoute = getRoute("portfolio");
  const favoritesRoute = getRoute("favorites");
  const adminRoute = getRoute("admin");

  // Auto-expand if user is on a profile/favorites/admin page
  useEffect(() => {
    const isUserPage =
      pathname.startsWith(profileRoute.path) ||
      pathname.startsWith(portfolioRoute.path) ||
      pathname.startsWith(favoritesRoute.path) ||
      pathname.startsWith(adminRoute.path);
    setIsUserOpen(isUserPage);
  }, [
    pathname,
    profileRoute.path,
    portfolioRoute.path,
    favoritesRoute.path,
    adminRoute.path,
  ]);

  const handleLogout = () => {
    signOut();
    onActionClick();
  };

  const linkClassName = (path: string) => {
    const baseClasses =
      "block w-full px-4 py-3 text-left text-base transition-colors rounded-lg";
    const activeClasses = pathname.startsWith(path)
      ? "bg-accent text-accent-foreground"
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground";
    return `${baseClasses} ${activeClasses}`;
  };

  const sectionHeaderClassName =
    "flex items-center justify-between w-full px-4 py-3 text-left transition-colors rounded-lg hover:bg-accent";

  return (
    <div className="mt-auto border-t border-border pt-4">
      <button
        onClick={() => setIsUserOpen(!isUserOpen)}
        className={sectionHeaderClassName}
        aria-expanded={isUserOpen}
      >
        <div className="flex items-center gap-3">
          {(() => {
            const displayImage = getUserImageUrl(
              user.profileImageUrl,
              user.image,
            );
            return displayImage ? (
              <Image
                src={displayImage}
                alt={user.name || t("userAvatar")}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                {user.name?.charAt(0).toUpperCase() || "?"}
              </div>
            );
          })()}
          {user.name && (
            <span className="text-sm font-medium text-foreground">
              {user.name}
            </span>
          )}
        </div>
        {isUserOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isUserOpen && (
        <div className="mt-1">
          {user.id && (
            <Link
              href={getCreatorUrl({ id: user.id, slug: user.slug })}
              className={cn(
                linkClassName(profileRoute.path),
                "flex items-center gap-2",
              )}
              onClick={onActionClick}
            >
              {profileRoute.icon && <profileRoute.icon className="h-5 w-5" />}
              {t("profile")}
            </Link>
          )}
          {user.id && (
            <Link
              href={`${getCreatorUrl({ id: user.id, slug: user.slug })}/portfolio`}
              className={cn(
                linkClassName(portfolioRoute.path),
                "flex items-center gap-2",
              )}
              onClick={onActionClick}
            >
              {portfolioRoute.icon && (
                <portfolioRoute.icon className="h-5 w-5" />
              )}
              {t("portfolio")}
            </Link>
          )}
          <Link
            href={favoritesRoute.path}
            className={cn(
              linkClassName(favoritesRoute.path),
              "flex items-center gap-2",
            )}
            onClick={onActionClick}
          >
            {favoritesRoute.icon && <favoritesRoute.icon className="h-5 w-5" />}
            {t("favorites")}
          </Link>
          {user.isAdmin && (
            <Link
              href={adminRoute.path}
              className={cn(
                linkClassName(adminRoute.path),
                "flex items-center gap-2",
              )}
              onClick={onActionClick}
            >
              {adminRoute.icon && <adminRoute.icon className="h-5 w-5" />}
              {t("adminDashboard")}
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 text-left text-base text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground rounded-lg"
          >
            {t("logout")}
          </button>
        </div>
      )}
    </div>
  );
}
