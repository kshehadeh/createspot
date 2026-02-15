"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Heart, LayoutGrid, Landmark, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoute } from "@/lib/routes";

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  isActive: boolean;
}

export function InspireSidebar() {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const { data: session } = useSession();

  const exhibitionRoute = getRoute("exhibition");
  const museumsRoute = getRoute("museums");
  const promptRoute = getRoute("prompt");
  const communityRoute = getRoute("community");
  const favoritesRoute = getRoute("favorites");

  const navItems: NavItem[] = [
    {
      href: exhibitionRoute.path,
      labelKey: "exhibits",
      icon: LayoutGrid,
      isActive:
        pathname === exhibitionRoute.path ||
        pathname.startsWith(`${exhibitionRoute.path}/`),
    },
    {
      href: museumsRoute.path,
      labelKey: "museums",
      icon: Landmark,
      isActive: pathname === museumsRoute.path,
    },
    {
      href: promptRoute.path,
      labelKey: "prompts",
      icon: Sparkles,
      isActive:
        pathname === promptRoute.path ||
        pathname.startsWith(`${promptRoute.path}/`),
    },
    {
      href: communityRoute.path,
      labelKey: "community",
      icon: Users,
      isActive: pathname === communityRoute.path,
    },
    ...(session?.user
      ? [
          {
            href: favoritesRoute.path,
            labelKey: "favorites" as const,
            icon: Heart,
            isActive: pathname === favoritesRoute.path,
          },
        ]
      : []),
  ];

  const linkClass = (item: NavItem) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      item.isActive
        ? "bg-accent text-accent-foreground"
        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
    );

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-background">
      <nav className="flex-1 p-2 pt-4" aria-label="Inspire">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={linkClass(item)}>
                <item.icon className="h-4 w-4 shrink-0" />
                {t(item.labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
