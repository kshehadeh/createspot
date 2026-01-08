"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, startTransition } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { CreateSpotLogo } from "./create-spot-logo";
import { UserDropdown } from "./user-dropdown";
import { NavigationLinks } from "./navigation-links";
import { ThemeToggle } from "./theme-toggle";

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
  if (pathname === "/exhibition/constellation") return ["Exhibit", "Constellation"];
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
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground"
          >
            <CreateSpotLogo
              className="h-6 w-auto"
              base="currentColor"
              highlight="rgb(161 161 170)"
            />
            <span className="text-xl font-normal">Create Spot</span>
          </Link>
          {breadcrumbs && breadcrumbs.map((segment, index) => (
            <span key={index} className="flex items-center gap-6">
              <span className="text-muted-foreground">/</span>
              <span className="text-lg text-muted-foreground">{segment}</span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-4">
            <NavigationLinks
              isAuthenticated={!!user}
              isAdmin={!!user?.isAdmin}
            />
            <ThemeToggle />
            {user && <UserDropdown id={user.id} name={user.name} image={user.image} isAdmin={user.isAdmin} />}
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
            <span className="text-lg font-medium text-foreground">
              Menu
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
            <div className="mt-4 flex justify-center">
              <ThemeToggle />
            </div>
            {user && (
              <div className="mt-auto border-t border-border pt-4">
                <div className="flex items-center gap-3 px-4 py-2">
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
                <MobileUserActions 
                  isAdmin={!!user?.isAdmin}
                  onActionClick={() => setIsMenuOpen(false)} 
                />
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
  isAdmin,
  onLinkClick,
}: {
  isAuthenticated?: boolean;
  isAdmin?: boolean;
  onLinkClick: () => void;
}) {
  const pathname = usePathname();

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
        <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Explore
        </div>
        <Link
          href="/exhibition/gallery"
          className={linkClassName("/exhibition/gallery")}
          onClick={onLinkClick}
        >
          Gallery
        </Link>
        <Link
          href="/exhibition/constellation"
          className={linkClassName("/exhibition/constellation")}
          onClick={onLinkClick}
        >
          Constellation
        </Link>
        <Link
          href="/about"
          className={linkClassName("/about")}
          onClick={onLinkClick}
        >
          About
        </Link>
      </div>
      <div className="mb-2">
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Prompts
          </div>
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
    </>
  );
}

// Mobile User Actions Component
function MobileUserActions({ 
  isAdmin, 
  onActionClick 
}: { 
  isAdmin?: boolean;
  onActionClick: () => void;
}) {
  const pathname = usePathname();
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

  return (
    <>
      <Link
        href="/profile/edit"
        className={linkClassName("/profile/edit")}
        onClick={onActionClick}
      >
        Edit Profile
      </Link>
      <Link
        href="/favorites"
        className={linkClassName("/favorites")}
        onClick={onActionClick}
      >
        Favorites
      </Link>
      {isAdmin && (
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
    </>
  );
}
