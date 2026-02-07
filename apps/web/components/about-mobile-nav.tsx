"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Info,
  Target,
  Sparkles,
  Lightbulb,
  FileText,
  ScrollText,
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
  const promptSubmissionsRoute = getRoute("aboutPromptSubmissions");
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
