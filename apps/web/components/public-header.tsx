"use client";

import { useState } from "react";
import Link from "@/components/link";
import { useTranslations } from "next-intl";
import { CreateSpotLogo } from "./create-spot-logo";
import { MobileNavigation } from "./mobile-navigation";
import { SubmissionEditModal } from "./submission-edit-modal";
import { ThemeToggle } from "./theme-toggle";

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
        <div className="flex items-center justify-end gap-3">
          {/* Desktop: theme toggle + sign-in */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {!user && (
              <Link
                href="/welcome"
                className="begin-button rounded-full px-4 py-2 text-sm font-medium text-primary-foreground transition-colors"
              >
                {tNav("jumpIn")}
              </Link>
            )}
          </div>
          {/* Mobile: hamburger (ThemeToggle lives inside the sidebar) */}
          <div className="flex md:hidden">
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
