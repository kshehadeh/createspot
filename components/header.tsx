"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { CreateSpotLogo } from "./create-spot-logo";
import { UserDropdown } from "./user-dropdown";
import { DashboardNavigation } from "./navigation-links";
import { MobileNavigation } from "./mobile-navigation";
import { ThemeToggle } from "./theme-toggle";
import { SubmissionEditModal } from "./submission-edit-modal";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { getRoute } from "@/lib/routes";

interface HeaderUser {
  id?: string;
  name?: string | null;
  image?: string | null;
  isAdmin?: boolean;
}

interface HeaderProps {
  user?: HeaderUser | null;
}

export function Header({ user }: HeaderProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
            {user && (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                variant="default"
                size="default"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create
              </Button>
            )}
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
