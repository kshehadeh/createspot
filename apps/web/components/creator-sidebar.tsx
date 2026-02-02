"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  User,
  Briefcase,
  FolderOpen,
  Pencil,
  Eye,
  Settings,
  MessageSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavChild {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  target?: string;
  rel?: string;
}

interface CreatorSidebarProps {
  creatorUrl: string;
}

export function CreatorSidebar({ creatorUrl }: CreatorSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("creatorNav");
  const tProfile = useTranslations("profile");
  const tCollections = useTranslations("collections");
  const isPublicView = searchParams?.get("view") === "public";

  if (isPublicView) {
    return null;
  }

  const profileChildren: NavChild[] = [
    {
      href: `${creatorUrl}/edit`,
      label: tProfile("editProfile"),
      icon: Pencil,
      isActive: pathname === `${creatorUrl}/edit`,
    },
    {
      href: `${creatorUrl}?view=public`,
      label: tProfile("viewAsAnonymous"),
      icon: Eye,
      isActive: pathname === creatorUrl && isPublicView,
      target: "_blank",
      rel: "noreferrer",
    },
    {
      href: `${creatorUrl}/critiques`,
      label: t("critiques"),
      icon: MessageSquare,
      isActive: pathname === `${creatorUrl}/critiques`,
    },
  ];

  const portfolioChildren: NavChild[] = [
    {
      href: `${creatorUrl}/portfolio/edit`,
      label: tProfile("managePortfolio"),
      icon: Settings,
      isActive: pathname === `${creatorUrl}/portfolio/edit`,
    },
    {
      href: `${creatorUrl}/collections`,
      label: tCollections("manageCollections"),
      icon: FolderOpen,
      isActive: pathname.startsWith(`${creatorUrl}/collections`),
    },
  ];

  const navItems = [
    {
      href: creatorUrl,
      label: t("profile"),
      icon: User,
      isDirectlyActive: pathname === creatorUrl && !isPublicView,
      hasActiveChild: profileChildren.some((c) => c.isActive),
      children: profileChildren,
    },
    {
      href: `${creatorUrl}/portfolio`,
      label: t("portfolio"),
      icon: Briefcase,
      isDirectlyActive:
        pathname === `${creatorUrl}/portfolio` ||
        (pathname.startsWith(`${creatorUrl}/portfolio/`) &&
          !portfolioChildren.some((c) => c.isActive)),
      hasActiveChild: portfolioChildren.some((c) => c.isActive),
      children: portfolioChildren,
    },
  ];

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
                  item.isDirectlyActive
                    ? "bg-accent text-accent-foreground"
                    : item.hasActiveChild
                      ? "text-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
              {item.children.length > 0 && (
                <div className="mt-1 space-y-0.5 pl-3">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      target={child.target}
                      rel={child.rel}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                        child.isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                      )}
                    >
                      {child.icon && (
                        <child.icon className="h-3 w-3 shrink-0" />
                      )}
                      <span className="truncate">{child.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
