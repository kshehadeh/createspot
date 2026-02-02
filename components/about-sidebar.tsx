"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  ChevronDown,
  User,
  FolderOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoute } from "@/lib/routes";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const profileRoute = getRoute("aboutProfile");
  const portfolioRoute = getRoute("aboutPortfolio");
  const promptSubmissionsRoute = getRoute("aboutPromptSubmissions");
  const critiquesRoute = getRoute("aboutCritiques");
  const badgesRoute = getRoute("aboutBadges");
  const protectingRoute = getRoute("aboutProtectingYourWork");
  const termsRoute = getRoute("terms");

  const featurePaths = [
    featuresRoute.path,
    critiquesRoute.path,
    badgesRoute.path,
    protectingRoute.path,
    profileRoute.path,
    portfolioRoute.path,
  ];
  const isOnFeaturePage = featurePaths.includes(pathname);
  const [featuresOpen, setFeaturesOpen] = useState(isOnFeaturePage);

  useEffect(() => {
    if (isOnFeaturePage) setFeaturesOpen(true);
  }, [isOnFeaturePage]);

  const featuresParent: NavItem = {
    href: featuresRoute.path,
    labelKey: "features.title",
    translationNamespace: "about",
    icon: Sparkles,
    isActive: pathname === featuresRoute.path,
  };

  const featuresChildren: NavItem[] = [
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
  ];

  const topLevelItems: NavItem[] = [
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
  ];

  const restItems: NavItem[] = [
    {
      href: promptSubmissionsRoute.path,
      labelKey: "promptInspiration.title",
      translationNamespace: "about",
      icon: Lightbulb,
      isActive: pathname === promptSubmissionsRoute.path,
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
      <nav className="flex-1 p-2 pt-4" aria-label="About">
        <ul className="space-y-2">
          {topLevelItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={linkClass(item)}>
                <item.icon className="h-4 w-4 shrink-0" />
                {getLabel(item)}
              </Link>
            </li>
          ))}
          <li>
            <Collapsible
              open={featuresOpen}
              onOpenChange={setFeaturesOpen}
              aria-expanded={featuresOpen}
            >
              <div
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-colors",
                  featuresParent.isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground",
                )}
              >
                <Link
                  href={featuresRoute.path}
                  className={cn(
                    "flex flex-1 min-w-0 items-center gap-3 rounded-l-lg px-3 py-2 transition-colors",
                    !featuresParent.isActive &&
                      "hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  <featuresParent.icon className="h-4 w-4 shrink-0" />
                  {getLabel(featuresParent)}
                </Link>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex shrink-0 rounded-r-lg p-2 hover:bg-accent/50 transition-colors"
                    aria-label={
                      featuresOpen ? "Collapse features" : "Expand features"
                    }
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        featuresOpen && "rotate-180",
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <ul className="mt-1 space-y-1 pl-6">
                  {featuresChildren.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className={linkClass(item)}>
                        <item.icon className="h-4 w-4 shrink-0" />
                        {getLabel(item)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          </li>
          {restItems.map((item) => (
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
