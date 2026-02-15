"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/share-button";
import { PortfolioFilters } from "@/components/portfolio-filters";
import { MobileTitleDropdown } from "@/components/mobile-title-dropdown";
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
    <MobileTitleDropdown open={isOpen} onOpenChange={setIsOpen} title={title}>
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
    </MobileTitleDropdown>
  );
}
