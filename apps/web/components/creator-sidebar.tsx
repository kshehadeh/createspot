"use client";

import Link from "@/components/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  User,
  Briefcase,
  FolderOpen,
  MessageSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreatorSidebarProps {
  creatorUrl: string;
}

export function CreatorSidebar({ creatorUrl }: CreatorSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("creatorNav");
  const isPublicView = searchParams?.get("view") === "public";

  if (isPublicView) {
    return null;
  }

  const navItems: {
    href: string;
    label: string;
    icon: LucideIcon;
    isActive: boolean;
  }[] = [
    {
      href: creatorUrl,
      label: t("profile"),
      icon: User,
      isActive:
        pathname === creatorUrl || pathname === `${creatorUrl}/edit`,
    },
    {
      href: `${creatorUrl}/portfolio`,
      label: t("portfolio"),
      icon: Briefcase,
      isActive: pathname.startsWith(`${creatorUrl}/portfolio`),
    },
    {
      href: `${creatorUrl}/critiques`,
      label: t("critiques"),
      icon: MessageSquare,
      isActive: pathname.startsWith(`${creatorUrl}/critiques`),
    },
    {
      href: `${creatorUrl}/collections`,
      label: t("collections"),
      icon: FolderOpen,
      isActive: pathname.startsWith(`${creatorUrl}/collections`),
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
                  item.isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
