"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, startTransition } from "react";
import { usePathname } from "next/navigation";
import { signOut, signIn } from "next-auth/react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { getRoute } from "@/lib/routes";
import { ChevronDown, ChevronRight } from "lucide-react";

interface MobileNavigationUser {
  id?: string;
  name?: string | null;
  image?: string | null;
  isAdmin?: boolean;
}

interface MobileNavigationProps {
  user?: MobileNavigationUser | null;
}

export function MobileNavigation({ user }: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

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
            <MobileNavigationLinks onLinkClick={() => setIsMenuOpen(false)} />
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
  onLinkClick,
}: {
  isAuthenticated?: boolean;
  isAdmin?: boolean;
  onLinkClick: () => void;
}) {
  const pathname = usePathname();
  const exhibitionRoute = getRoute("exhibition");
  const promptRoute = getRoute("prompt");
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
          {exhibitionRoute.label}
        </Link>
      </div>
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
          {promptRoute.label}
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
          {aboutRoute.label}
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
  user: MobileNavigationUser;
  onActionClick: () => void;
}) {
  const pathname = usePathname();
  const [isUserOpen, setIsUserOpen] = useState(false);
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
              href={`${profileRoute.path}/${user.id}`}
              className={cn(
                linkClassName(profileRoute.path),
                "flex items-center gap-2",
              )}
              onClick={onActionClick}
            >
              {profileRoute.icon && <profileRoute.icon className="h-5 w-5" />}
              View Profile
            </Link>
          )}
          {user.id && (
            <Link
              href={`${portfolioRoute.path}/${user.id}`}
              className={cn(
                linkClassName(portfolioRoute.path),
                "flex items-center gap-2",
              )}
              onClick={onActionClick}
            >
              {portfolioRoute.icon && (
                <portfolioRoute.icon className="h-5 w-5" />
              )}
              View Portfolio
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
            {favoritesRoute.label}
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
              Admin Dashboard
            </Link>
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
