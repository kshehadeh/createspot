"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Info,
  Target,
  Sparkles,
  Briefcase,
  Lightbulb,
  MessageSquare,
  Award,
  Shield,
  FileText,
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

export function AboutSidebar() {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const tAbout = useTranslations("about");

  const aboutRoute = getRoute("about");
  const purposeRoute = getRoute("aboutPurpose");
  const featuresRoute = getRoute("aboutFeatures");
  const portfoliosRoute = getRoute("aboutPortfoliosAndSharing");
  const promptSubmissionsRoute = getRoute("aboutPromptSubmissions");
  const critiquesRoute = getRoute("aboutCritiques");
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
      href: critiquesRoute.path,
      labelKey: "critiques",
      translationNamespace: "navigation",
      icon: MessageSquare,
      isActive: pathname === critiquesRoute.path,
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

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-background">
      <nav className="flex-1 p-2 pt-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  item.isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {getLabel(item)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
