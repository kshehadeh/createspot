"use client";

import Link from "@/components/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { User, Briefcase, FolderOpen, MessageSquare } from "lucide-react";
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
      isActive: pathname === creatorUrl || pathname === `${creatorUrl}/edit`,
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
    <aside className="sticky top-24 hidden h-fit w-64 shrink-0 md:ml-6 md:flex lg:ml-12">
      <nav className="w-full rounded-2xl bg-surface-container p-3 shadow-[0_14px_35px_rgb(0_0_0_/_0.35)]">
        <p className="px-3 pb-2 text-xs font-semibold tracking-[0.12em] text-on-surface-variant uppercase">
          Creator Hub
        </p>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  item.isActive
                    ? "bg-surface-container-high text-foreground shadow-[0_10px_24px_rgb(0_0_0_/_0.24)]"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-foreground",
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
