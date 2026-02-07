"use client";

import Link from "next/link";
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
  const promptSubmissionsRoute = getRoute("aboutPromptSubmissions");
  const changelogRoute = getRoute("aboutChangelog");
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

  const getLabel = (item: NavItem) => {
    if (item.translationNamespace === "navigation") {
      return t(item.labelKey);
    }
    return tAbout(item.labelKey);
  };

  const linkClass = (item: NavItem) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      item.isActive
        ? "bg-accent text-accent-foreground"
        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
    );

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-background">
      <nav className="flex-1 p-2 pt-4" aria-label="Support">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={linkClass(item)}>
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
