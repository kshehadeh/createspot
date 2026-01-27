"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { CreateSpotLogo } from "./create-spot-logo";
import { DashboardNavigation } from "./navigation-links";
import { MobileNavigation } from "./mobile-navigation";
import { ThemeToggle } from "./theme-toggle";
import { SubmissionEditModal } from "./submission-edit-modal";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { getRoute } from "@/lib/routes";

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M19.73 4.44A16.95 16.95 0 0 0 15.5 3a12.4 12.4 0 0 0-.6 1.22 16.2 16.2 0 0 0-4.79 0c-.18-.42-.38-.83-.6-1.22A16.9 16.9 0 0 0 5.27 4.44C2.7 8.3 1.97 12 2.36 15.64a16.7 16.7 0 0 0 5.06 2.6c.41-.56.78-1.15 1.09-1.76a10.8 10.8 0 0 1-1.71-.83c.14-.1.28-.2.42-.3a12.1 12.1 0 0 0 10.56 0c.14.1.28.2.42.3-.55.33-1.12.62-1.71.83.31.61.68 1.2 1.09 1.76a16.7 16.7 0 0 0 5.06-2.6c.49-4.36-.84-8.02-2.91-11.2ZM9.1 13.43c-.92 0-1.67-.86-1.67-1.92s.74-1.92 1.67-1.92c.93 0 1.69.86 1.67 1.92 0 1.06-.74 1.92-1.67 1.92Zm5.8 0c-.92 0-1.67-.86-1.67-1.92s.74-1.92 1.67-1.92c.93 0 1.69.86 1.67 1.92 0 1.06-.74 1.92-1.67 1.92Z" />
  </svg>
);

// Dynamically import UserDropdown to avoid SSR hydration issues with Radix UI
const UserDropdown = dynamic(
  () =>
    import("./user-dropdown").then((mod) => ({ default: mod.UserDropdown })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2 border-l border-border pl-4">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      </div>
    ),
  },
);

interface HeaderUser {
  id?: string;
  slug?: string | null;
  name?: string | null;
  image?: string | null;
  profileImageUrl?: string | null;
  isAdmin?: boolean;
}

interface HeaderProps {
  user?: HeaderUser | null;
}

export function Header({ user }: HeaderProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const t = useTranslations("navigation");

  return (
    <>
      <header className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-12">
        <div className="flex items-center">
          <Link
            href={getRoute("home").path}
            className="flex items-center gap-2 text-foreground"
          >
            <CreateSpotLogo
              className="h-6 w-auto"
              base="currentColor"
              highlight="rgb(161 161 170)"
            />
            <span className="hidden whitespace-nowrap text-2xl font-normal md:inline font-permanent-marker">
              Create Spot
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-4">
            <DashboardNavigation />
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                aria-label={t("joinDiscord")}
                title={t("joinDiscord")}
              >
                <a
                  href="https://discord.gg/vrDZhCahcp"
                  target="_blank"
                  rel="noreferrer"
                >
                  <DiscordIcon className="h-4 w-4" />
                </a>
              </Button>
            </div>
            {user && (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                variant="default"
                size="default"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t("create")}
              </Button>
            )}
            <ThemeToggle />
            {user ? (
              <UserDropdown
                id={user.id}
                slug={user.slug}
                name={user.name}
                image={user.image}
                profileImageUrl={user.profileImageUrl}
                isAdmin={user.isAdmin}
              />
            ) : (
              <Button
                onClick={() => signIn("google")}
                variant="default"
                size="default"
              >
                {t("signIn")}
              </Button>
            )}
          </div>
          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              aria-label={t("joinDiscord")}
              title={t("joinDiscord")}
            >
              <a
                href="https://discord.gg/vrDZhCahcp"
                target="_blank"
                rel="noreferrer"
              >
                <DiscordIcon className="h-4 w-4" />
              </a>
            </Button>
            <ThemeToggle />
            {!user && (
              <Button
                onClick={() => signIn("google")}
                variant="default"
                size="sm"
              >
                {t("signIn")}
              </Button>
            )}
            <MobileNavigation user={user} />
          </div>
        </div>
      </header>
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
