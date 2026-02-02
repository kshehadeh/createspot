"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Info,
  Target,
  Sparkles,
  Lightbulb,
  MessageSquare,
  Award,
  Shield,
  FileText,
  ScrollText,
  User,
  FolderOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getRoute } from "@/lib/routes";
import { MobileNavBar } from "@/components/mobile-nav-bar";

interface NavItemConfig {
  href: string;
  labelKey: string;
  translationNamespace: string;
  icon: LucideIcon;
  isActive: boolean;
}

export function AboutMobileNav() {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const tAbout = useTranslations("about");

  const aboutRoute = getRoute("about");
  const purposeRoute = getRoute("aboutPurpose");
  const featuresRoute = getRoute("aboutFeatures");
  const profileRoute = getRoute("aboutProfile");
  const portfolioRoute = getRoute("aboutPortfolio");
  const promptSubmissionsRoute = getRoute("aboutPromptSubmissions");
  const critiquesRoute = getRoute("aboutCritiques");
  const badgesRoute = getRoute("aboutBadges");
  const protectingRoute = getRoute("aboutProtectingYourWork");
  const changelogRoute = getRoute("aboutChangelog");
  const termsRoute = getRoute("terms");

  const navConfig: NavItemConfig[] = [
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
      href: profileRoute.path,
      labelKey: "profile",
      translationNamespace: "navigation",
      icon: User,
      isActive: pathname === profileRoute.path,
    },
    {
      href: portfolioRoute.path,
      labelKey: "portfolio",
      translationNamespace: "navigation",
      icon: FolderOpen,
      isActive: pathname === portfolioRoute.path,
    },
    {
      href: promptSubmissionsRoute.path,
      labelKey: "promptInspiration.title",
      translationNamespace: "about",
      icon: Lightbulb,
      isActive: pathname === promptSubmissionsRoute.path,
    },
    {
      href: changelogRoute.path,
      labelKey: "updates",
      translationNamespace: "navigation",
      icon: ScrollText,
      isActive: pathname === changelogRoute.path,
    },
    {
      href: termsRoute.path,
      labelKey: "terms",
      translationNamespace: "navigation",
      icon: FileText,
      isActive: pathname === termsRoute.path,
    },
  ];

  const items = navConfig.map((item) => ({
    href: item.href,
    label:
      item.translationNamespace === "navigation"
        ? t(item.labelKey)
        : tAbout(item.labelKey),
    icon: item.icon,
    isActive: item.isActive,
  }));

  return <MobileNavBar items={items} layout="grid" />;
}
