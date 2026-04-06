"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "@/components/link";
import { useTranslations } from "next-intl";
import { Button } from "@createspot/ui-primitives/button";
import { HelpCircle } from "lucide-react";
import { CreateSpotLogo } from "./create-spot-logo";
import { MobileNavigation } from "./mobile-navigation";
import { SubmissionEditModal } from "./submission-edit-modal";
import { ThemeToggle } from "./theme-toggle";

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

interface PublicHeaderUser {
  id?: string;
  slug?: string | null;
  name?: string | null;
  image?: string | null;
  profileImageUrl?: string | null;
  isAdmin?: boolean;
}

interface PublicHeaderProps {
  user?: PublicHeaderUser | null;
}

export function PublicHeader({ user }: PublicHeaderProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const tNav = useTranslations("navigation");

  return (
    <>
      <header className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-border px-6 py-4 sm:px-12">
        <div />
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <CreateSpotLogo
            className="h-6 w-auto"
            base="currentColor"
            highlight="rgb(161 161 170)"
          />
          <span className="whitespace-nowrap text-2xl font-normal font-permanent-marker">
            Create Spot
          </span>
        </Link>
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          {/* Desktop: theme toggle + about + sign-in */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <UserDropdown
                id={user.id}
                name={user.name}
                image={user.image}
                profileImageUrl={user.profileImageUrl}
              />
            ) : (
              <>
                <Button variant="outline" size="icon" className="shrink-0 rounded-full" asChild>
                  <Link href="/about" title={tNav("overview")} aria-label={tNav("overview")}>
                    <HelpCircle className="h-4 w-4" />
                  </Link>
                </Button>
                <Link
                  href="/welcome"
                  className="begin-button rounded-full px-4 py-2 text-sm font-medium text-primary-foreground transition-colors"
                >
                  {tNav("jumpIn")}
                </Link>
              </>
            )}
          </div>
          {/* Mobile: about + hamburger (ThemeToggle lives inside the sidebar) */}
          <div className="flex md:hidden items-center gap-2">
            {user ? (
              <UserDropdown
                id={user.id}
                name={user.name}
                image={user.image}
                profileImageUrl={user.profileImageUrl}
                triggerClassName="border-l-0 pl-0"
              />
            ) : (
              <Button variant="outline" size="icon" className="shrink-0 rounded-full" asChild>
                <Link href="/about" title={tNav("overview")} aria-label={tNav("overview")}>
                  <HelpCircle className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <MobileNavigation
              user={user}
              onCreateModalOpen={() => setIsCreateModalOpen(true)}
              showCreateButton={false}
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
