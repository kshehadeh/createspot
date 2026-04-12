"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "@/components/link";
import { useTranslations } from "next-intl";
import { CreateSpotLogo } from "./create-spot-logo";
import { MobileNavigation } from "./mobile-navigation";
import { ChevronDown, Plus, Signpost } from "lucide-react";

// Dynamically import nav chunks to avoid SSR hydration issues with Radix UI dropdown IDs
const DashboardNavigation = dynamic(
  () =>
    import("./navigation-links").then((mod) => ({
      default: mod.DashboardNavigation,
    })),
  {
    ssr: false,
    loading: () => (
      <nav className="flex items-center gap-1" aria-hidden="true">
        <div className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground whitespace-nowrap">
          <Signpost className="h-4 w-4" />
          <span>…</span>
          <ChevronDown className="h-3 w-3" />
        </div>
        <div className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground whitespace-nowrap">
          <Plus className="h-4 w-4" />
          <span>…</span>
          <ChevronDown className="h-3 w-3" />
        </div>
      </nav>
    ),
  },
);

const HeaderUtilityNav = dynamic(
  () =>
    import("./navigation-links").then((mod) => ({
      default: mod.HeaderUtilityNav,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-1" aria-hidden="true">
        <div className="size-9 rounded-lg bg-muted animate-pulse" />
        <div className="size-9 rounded-lg bg-muted animate-pulse" />
      </div>
    ),
  },
);
import { SubmissionEditModal } from "./submission-edit-modal";
import { Button } from "@createspot/ui-primitives/button";
import { SiDiscord } from "@icons-pack/react-simple-icons";
import { getRoute } from "@/lib/routes";

// Dynamically import UserDropdown to avoid SSR hydration issues with Radix UI
const UserDropdown = dynamic(
  () =>
    import("./user-dropdown").then((mod) => ({ default: mod.UserDropdown })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2 pl-4">
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
      <header className="sticky top-0 z-30 px-3 py-3 sm:px-6 sm:py-4 lg:px-12">
        <div className="glass-nav flex w-full items-center justify-between rounded-2xl border border-outline-variant/30 px-4 py-3 shadow-[0_14px_35px_rgb(0_0_0_/_0.35)] sm:px-5">
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
              <span className="whitespace-nowrap text-xl font-normal font-permanent-marker sm:text-2xl">
                Create Spot
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-3">
              <DashboardNavigation
                user={user}
                onCreateModalOpen={() => setIsCreateModalOpen(true)}
              />
              <div className="flex items-center gap-1 rounded-xl bg-surface-container-high px-1 py-1">
                <HeaderUtilityNav user={user} />
              </div>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="rounded-xl text-on-surface-variant hover:bg-surface-bright/60 hover:text-foreground"
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
              {user ? (
                <UserDropdown
                  id={user?.id}
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
                className="rounded-xl text-on-surface-variant hover:bg-surface-bright/60 hover:text-foreground"
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
              <MobileNavigation
                user={user}
                onCreateModalOpen={() => setIsCreateModalOpen(true)}
              />
            </div>
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
