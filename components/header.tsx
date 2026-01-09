"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, startTransition } from "react";
import { usePathname } from "next/navigation";
import { signOut, signIn } from "next-auth/react";
import { CreateSpotLogo } from "./create-spot-logo";
import { UserDropdown } from "./user-dropdown";
import { NavigationLinks } from "./navigation-links";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import {
  getExhibitionByPath,
  EXHIBITION_CONFIGS,
} from "@/lib/exhibition-constants";
import { cn } from "@/lib/utils";
import { Home, ChevronDown, ChevronRight } from "lucide-react";

interface HeaderUser {
  id?: string;
  name?: string | null;
  image?: string | null;
  isAdmin?: boolean;
}

interface HeaderProps {
  user?: HeaderUser | null;
}

// Get breadcrumb segments based on pathname
function getBreadcrumbs(pathname: string): string[] | null {
  // Homepage - no breadcrumbs
  if (pathname === "/") return null;

  // Exhibition routes
  if (pathname === "/exhibition/gallery") return ["Exhibit", "Gallery"];
  if (pathname === "/exhibition/constellation")
    return ["Exhibit", "Constellation"];
  if (pathname === "/exhibition/global") return ["Exhibit", "Global"];
  if (pathname.startsWith("/exhibition")) return ["Exhibit"];

  // Prompt routes
  if (pathname === "/prompt/play") return ["Prompts", "Play"];
  if (pathname === "/prompt/history") return ["Prompts", "History"];
  if (pathname === "/prompt/this-week") return ["Prompts", "This Week"];
  if (pathname.startsWith("/prompt")) return ["Prompts"];

  // Admin routes
  if (pathname === "/admin/users") return ["Admin", "Users"];
  if (pathname.startsWith("/admin")) return ["Admin"];

  // Profile routes
  if (pathname === "/profile/edit") return ["Profile", "Edit"];
  if (pathname.startsWith("/profile")) return ["Profile"];

  // Other routes
  if (pathname.startsWith("/favorites")) return ["Favorites"];
  if (pathname.startsWith("/s/")) return ["Submission"];
  if (pathname.startsWith("/about")) return ["About"];
  if (pathname.startsWith("/auth")) return null; // No breadcrumbs for auth

  return null;
}

export function Header({ user }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);
  const exhibitionConfig = getExhibitionByPath(pathname);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
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
  }, [isMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    startTransition(() => {
      setIsMenuOpen(false);
    });
  }, [pathname]);

  return (
    <>
      <header className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-12">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-foreground">
            <CreateSpotLogo
              className="h-6 w-auto"
              base="currentColor"
              highlight="rgb(161 161 170)"
            />
            <span className="hidden whitespace-nowrap text-2xl font-normal md:inline font-permanent-marker">
              Create Spot
            </span>
          </Link>
          {breadcrumbs &&
            breadcrumbs.map((segment, index) => {
              const isLastSegment = index === breadcrumbs.length - 1;
              const shouldShowIcon = isLastSegment && exhibitionConfig;
              const IconComponent = shouldShowIcon
                ? exhibitionConfig.icon
                : null;

              return (
                <span key={index} className="flex items-center gap-2">
                  <span className="text-muted-foreground">/</span>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    {IconComponent && <IconComponent className="h-5 w-5" />}
                    {segment}
                  </span>
                </span>
              );
            })}
        </div>
        <div className="flex items-center gap-4">
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-4">
            <NavigationLinks
              isAuthenticated={!!user}
              isAdmin={!!user?.isAdmin}
            />
            <ThemeToggle />
            {user ? (
              <UserDropdown
                id={user.id}
                name={user.name}
                image={user.image}
                isAdmin={user.isAdmin}
              />
            ) : (
              <Button
                onClick={() => signIn("google")}
                variant="default"
                size="default"
              >
                Sign in
              </Button>
            )}
          </div>
          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            {!user && (
              <Button
                onClick={() => signIn("google")}
                variant="default"
                size="sm"
              >
                Sign in
              </Button>
            )}
          </div>
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex flex-col gap-1.5 p-2 text-foreground md:hidden"
            aria-label="Toggle menu"
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
        </div>
      </header>

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
              aria-label="Close menu"
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
              isAuthenticated={!!user}
              isAdmin={!!user?.isAdmin}
              onLinkClick={() => setIsMenuOpen(false)}
            />
            {user ? (
              <MobileUserSection
                user={user}
                onActionClick={() => setIsMenuOpen(false)}
              />
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
                  Sign in
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}

// Mobile Navigation Links Component
function MobileNavigationLinks({
  isAuthenticated,
  onLinkClick,
}: {
  isAuthenticated?: boolean;
  isAdmin?: boolean;
  onLinkClick: () => void;
}) {
  const pathname = usePathname();
  const [isExhibitsOpen, setIsExhibitsOpen] = useState(false);
  const [isInspireOpen, setIsInspireOpen] = useState(false);

  // Auto-expand sections if current path matches
  useEffect(() => {
    const isExhibitionPage = pathname.startsWith("/exhibition");
    const isPromptPage = pathname.startsWith("/prompt");
    setIsExhibitsOpen(isExhibitionPage);
    setIsInspireOpen(isPromptPage);
  }, [pathname]);

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

  const sectionHeaderClassName =
    "flex items-center justify-between w-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg";

  return (
    <>
      <div className="mb-2">
        <button
          onClick={() => setIsExhibitsOpen(!isExhibitsOpen)}
          className={sectionHeaderClassName}
          aria-expanded={isExhibitsOpen}
        >
          <span>Exhibits</span>
          {isExhibitsOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {isExhibitsOpen && (
          <div className="mt-1">
            <Link
              href="/exhibition"
              className={cn(
                linkClassName("/exhibition"),
                "flex items-center gap-2",
              )}
              onClick={onLinkClick}
            >
              <Home className="h-5 w-5" />
              Home
            </Link>
            <Link
              href={EXHIBITION_CONFIGS.gallery.path}
              className={cn(
                linkClassName(EXHIBITION_CONFIGS.gallery.path),
                "flex items-center gap-2",
              )}
              onClick={onLinkClick}
            >
              <EXHIBITION_CONFIGS.gallery.icon className="h-5 w-5" />
              {EXHIBITION_CONFIGS.gallery.name}
            </Link>
            <Link
              href={EXHIBITION_CONFIGS.constellation.path}
              className={cn(
                linkClassName(EXHIBITION_CONFIGS.constellation.path),
                "flex items-center gap-2",
              )}
              onClick={onLinkClick}
            >
              <EXHIBITION_CONFIGS.constellation.icon className="h-5 w-5" />
              {EXHIBITION_CONFIGS.constellation.name}
            </Link>
            <Link
              href={EXHIBITION_CONFIGS.global.path}
              className={cn(
                linkClassName(EXHIBITION_CONFIGS.global.path),
                "flex items-center gap-2",
              )}
              onClick={onLinkClick}
            >
              <EXHIBITION_CONFIGS.global.icon className="h-5 w-5" />
              {EXHIBITION_CONFIGS.global.name}
            </Link>
          </div>
        )}
      </div>
      <div className="mb-2">
        <button
          onClick={() => setIsInspireOpen(!isInspireOpen)}
          className={sectionHeaderClassName}
          aria-expanded={isInspireOpen}
        >
          <span>Inspire</span>
          {isInspireOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {isInspireOpen && (
          <div className="mt-1">
            {isAuthenticated ? (
              <>
                <Link
                  href="/prompt"
                  className={linkClassName("/prompt")}
                  onClick={onLinkClick}
                >
                  About
                </Link>
                <Link
                  href="/prompt/play"
                  className={linkClassName("/prompt/play")}
                  onClick={onLinkClick}
                >
                  Play
                </Link>
                <Link
                  href="/prompt/history"
                  className={linkClassName("/prompt/history")}
                  onClick={onLinkClick}
                >
                  History
                </Link>
              </>
            ) : (
              <Link
                href="/prompt"
                className={linkClassName("/prompt")}
                onClick={onLinkClick}
              >
                About
              </Link>
            )}
          </div>
        )}
      </div>
      <div className="mb-2">
        <Link
          href="/about"
          className={linkClassName("/about")}
          onClick={onLinkClick}
        >
          About
        </Link>
      </div>
    </>
  );
}

// Mobile User Section Component
function MobileUserSection({
  user,
  onActionClick,
}: {
  user: HeaderUser;
  onActionClick: () => void;
}) {
  const pathname = usePathname();
  const [isUserOpen, setIsUserOpen] = useState(false);

  // Auto-expand if user is on a profile/favorites/admin page
  useEffect(() => {
    const isUserPage =
      pathname.startsWith("/profile") ||
      pathname.startsWith("/favorites") ||
      pathname.startsWith("/admin");
    setIsUserOpen(isUserPage);
  }, [pathname]);

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
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || "User avatar"}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
              {user.name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
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
              href={`/profile/${user.id}`}
              className={linkClassName("/profile")}
              onClick={onActionClick}
            >
              View Profile
            </Link>
          )}
          <Link
            href="/favorites"
            className={linkClassName("/favorites")}
            onClick={onActionClick}
          >
            Favorites
          </Link>
          {user.isAdmin && (
            <>
              <Link
                href="/admin"
                className={linkClassName("/admin")}
                onClick={onActionClick}
              >
                Manage Prompts
              </Link>
              <Link
                href="/admin/users"
                className={linkClassName("/admin/users")}
                onClick={onActionClick}
              >
                Manage Users
              </Link>
            </>
          )}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 text-left text-base text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground rounded-lg"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
