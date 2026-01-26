"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Info,
  Target,
  Sparkles,
  Briefcase,
  Lightbulb,
  Award,
  Shield,
  FileText,
  ChevronUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoute } from "@/lib/routes";

interface NavItem {
  href: string;
  labelKey: string;
  translationNamespace: string;
  icon: LucideIcon;
  isActive: boolean;
}

export function AboutMobileNav() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const tAbout = useTranslations("about");

  const aboutRoute = getRoute("about");
  const purposeRoute = getRoute("aboutPurpose");
  const featuresRoute = getRoute("aboutFeatures");
  const portfoliosRoute = getRoute("aboutPortfoliosAndSharing");
  const promptSubmissionsRoute = getRoute("aboutPromptSubmissions");
  const badgesRoute = getRoute("aboutBadges");
  const protectingRoute = getRoute("aboutProtectingYourWork");
  const termsRoute = getRoute("terms");

  const navItems: NavItem[] = [
    {
      href: aboutRoute.path,
      labelKey: "about",
      translationNamespace: "navigation",
      icon: Info,
      isActive: pathname === aboutRoute.path,
    },
    {
      href: purposeRoute.path,
      labelKey: "purpose.title",
      translationNamespace: "about",
      icon: Target,
      isActive: pathname === purposeRoute.path,
    },
    {
      href: featuresRoute.path,
      labelKey: "features.title",
      translationNamespace: "about",
      icon: Sparkles,
      isActive: pathname === featuresRoute.path,
    },
    {
      href: portfoliosRoute.path,
      labelKey: "organization.title",
      translationNamespace: "about",
      icon: Briefcase,
      isActive: pathname === portfoliosRoute.path,
    },
    {
      href: promptSubmissionsRoute.path,
      labelKey: "promptInspiration.title",
      translationNamespace: "about",
      icon: Lightbulb,
      isActive: pathname === promptSubmissionsRoute.path,
    },
    {
      href: badgesRoute.path,
      labelKey: "badges.title",
      translationNamespace: "about",
      icon: Award,
      isActive: pathname === badgesRoute.path,
    },
    {
      href: protectingRoute.path,
      labelKey: "protectingYourWork.title",
      translationNamespace: "about",
      icon: Shield,
      isActive: pathname === protectingRoute.path,
    },
    {
      href: termsRoute.path,
      labelKey: "terms",
      translationNamespace: "navigation",
      icon: FileText,
      isActive: pathname === termsRoute.path,
    },
  ];

  const getLabel = (item: NavItem) => {
    if (item.translationNamespace === "navigation") {
      return t(item.labelKey);
    }
    return tAbout(item.labelKey);
  };

  const activeItem = navItems.find((item) => item.isActive) || navItems[0];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Navigation bar */}
      <div className="relative border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {isExpanded ? (
          <nav className="p-2">
            <ul className="flex items-center justify-around flex-wrap gap-1">
              {navItems.map((item) => (
                <li key={item.href} className="flex-1 min-w-0">
                  <Link
                    href={item.href}
                    onClick={() => setIsExpanded(false)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
                      item.isActive
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <item.icon
                      className={cn("h-5 w-5", item.isActive && "text-primary")}
                    />
                    <span className="truncate text-center w-full">
                      {getLabel(item)}
                    </span>
                    {item.isActive && (
                      <span className="h-1 w-1 rounded-full bg-primary" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-foreground"
          >
            <activeItem.icon className="h-4 w-4" />
            <span className="truncate">{getLabel(activeItem)}</span>
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
