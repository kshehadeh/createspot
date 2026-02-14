"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/share-button";
import { PortfolioFilters } from "@/components/portfolio-filters";
import { getCreatorUrl } from "@/lib/utils";

interface PortfolioMobileMenuProps {
  title: string;
  userId: string;
  isOwnPortfolio: boolean;
  user: { id: string; name: string | null; slug?: string | null };
  filterProps: {
    initialShareStatus: string[];
    initialTags: string[];
    initialCategories: string[];
    categories: string[];
    userId: string;
  };
}

export function PortfolioMobileMenu({
  title,
  userId,
  isOwnPortfolio,
  user,
  filterProps,
}: PortfolioMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("profile");

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 text-2xl font-bold text-foreground"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-none border border-border bg-background p-4 shadow-lg">
            {isOwnPortfolio && (
              <PortfolioFilters
                {...filterProps}
                onFilterChange={() => setIsOpen(false)}
                className="mb-0"
              />
            )}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <ShareButton type="portfolio" userId={userId} />
              {isOwnPortfolio && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`${getCreatorUrl(user)}/portfolio/edit`}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">{t("managePortfolio")}</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
