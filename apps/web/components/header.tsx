"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CreateSpotLogo } from "./create-spot-logo";
import { DashboardNavigation } from "./navigation-links";
import { MobileNavigation } from "./mobile-navigation";
import { SubmissionEditModal } from "./submission-edit-modal";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { SiDiscord } from "@icons-pack/react-simple-icons";
import { getRoute } from "@/lib/routes";

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

// Dynamically import JumpInDropdown to avoid SSR hydration issues with Radix UI
const JumpInDropdown = dynamic(
  () =>
    import("./jump-in-dropdown").then((mod) => ({
      default: mod.JumpInDropdown,
    })),
  { ssr: false },
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
            <DashboardNavigation
              user={user}
              onCreateModalOpen={() => setIsCreateModalOpen(true)}
            />
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
                  <SiDiscord className="h-4 w-4" />
                </a>
              </Button>
              <ThemeToggle />
            </div>
            {user ? (
              <UserDropdown
                name={user?.name}
                image={user?.image}
                profileImageUrl={user?.profileImageUrl}
              />
            ) : (
              <JumpInDropdown />
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
                <SiDiscord className="h-4 w-4" />
              </a>
            </Button>
            <ThemeToggle />
            <MobileNavigation
              user={user}
              onCreateModalOpen={() => setIsCreateModalOpen(true)}
            />
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
