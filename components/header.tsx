"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Logo } from "./logo";
import { UserDropdown } from "./user-dropdown";
import { NavigationLinks } from "./navigation-links";

interface HeaderUser {
  name?: string | null;
  image?: string | null;
  isAdmin?: boolean;
}

interface HeaderProps {
  title?: string;
  user?: HeaderUser | null;
}

export function Header({ title, user }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
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
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800 sm:px-12">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-900 dark:text-white"
          >
            <Logo className="h-6 w-10" />
            <span className="text-xl font-normal">Prompts</span>
          </Link>
          {title && (
            <>
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              <span className="text-lg text-zinc-600 dark:text-zinc-400">
                {title}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-4">
            <NavigationLinks
              isAuthenticated={!!user}
              isAdmin={!!user?.isAdmin}
            />
            {user && <UserDropdown name={user.name} image={user.image} />}
          </div>
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex flex-col gap-1.5 p-2 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <span
              className={`h-0.5 w-6 bg-zinc-900 transition-all dark:bg-white ${
                isMenuOpen ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`h-0.5 w-6 bg-zinc-900 transition-all dark:bg-white ${
                isMenuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`h-0.5 w-6 bg-zinc-900 transition-all dark:bg-white ${
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
        className={`fixed right-0 top-0 z-50 h-full w-64 transform border-l border-zinc-200 bg-white transition-transform duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-900 md:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Menu Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <span className="text-lg font-medium text-zinc-900 dark:text-white">
              Menu
            </span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
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
            {user && (
              <div className="mt-auto border-t border-zinc-200 pt-4 dark:border-zinc-800">
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                      {user.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  {user.name && (
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                      {user.name}
                    </span>
                  )}
                </div>
                <MobileUserActions onActionClick={() => setIsMenuOpen(false)} />
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
      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800";
    return `${baseClasses} ${activeClasses}`;
  };

  return (
    <>
      <Link
        href="/this-week"
        className={linkClassName("/this-week")}
        onClick={onLinkClick}
      >
        Gallery
      </Link>
      {isAuthenticated && (
        <>
          <Link
            href="/play"
            className={linkClassName("/play")}
            onClick={onLinkClick}
          >
            Play
          </Link>
          <Link
            href="/history"
            className={linkClassName("/history")}
            onClick={onLinkClick}
          >
            History
          </Link>
        </>
      )}
      {isAdmin && (
        <div className="mt-2">
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Admin
          </div>
          <Link
            href="/admin"
            className={linkClassName("/admin")}
            onClick={onLinkClick}
          >
            Manage Prompts
          </Link>
          <Link
            href="/admin/users"
            className={linkClassName("/admin/users")}
            onClick={onLinkClick}
          >
            Manage Users
          </Link>
        </div>
      )}
    </>
  );
}

// Mobile User Actions Component
function MobileUserActions({
  onActionClick,
}: {
  onActionClick: () => void;
}) {
  const handleLogout = () => {
    signOut();
    onActionClick();
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full px-4 py-3 text-left text-base text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      Logout
    </button>
  );
}
