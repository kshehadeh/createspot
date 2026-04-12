"use client";

import Link from "@/components/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Heart, LayoutGrid, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoute, isCreatorsListingPath } from "@/lib/routes";

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
  const communityRoute = getRoute("community");
  const creatorsInspirePath = "/inspire/creators";
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
      href: creatorsInspirePath,
      labelKey: "creators",
      icon: Users,
      isActive: isCreatorsListingPath(pathname),
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
      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
      item.isActive
        ? "bg-surface-container-high text-foreground shadow-[0_10px_24px_rgb(0_0_0_/_0.24)]"
        : "text-on-surface-variant hover:bg-surface-container-high hover:text-foreground",
    );

  return (
    <aside className="sticky top-24 hidden h-fit w-64 shrink-0 md:ml-6 md:flex lg:ml-12">
      <nav
        className="w-full rounded-2xl bg-surface-container p-3 shadow-[0_14px_35px_rgb(0_0_0_/_0.35)]"
        aria-label="Inspire"
      >
        <p className="px-3 pb-2 text-xs font-semibold tracking-[0.12em] text-on-surface-variant uppercase">
          Inspire
        </p>
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
