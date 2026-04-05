"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Heart, LayoutGrid, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getRoute } from "@/lib/routes";
import { MobileNavBar } from "@/components/mobile-nav-bar";

interface NavItemConfig {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  isActive: boolean;
}

export function InspireMobileNav() {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const { data: session } = useSession();

  const exhibitionRoute = getRoute("exhibition");
  const communityRoute = getRoute("community");
  const favoritesRoute = getRoute("favorites");

  const navConfig: NavItemConfig[] = [
    {
      href: exhibitionRoute.path,
      labelKey: "exhibits",
      icon: LayoutGrid,
      isActive:
        pathname === exhibitionRoute.path ||
        pathname.startsWith(`${exhibitionRoute.path}/`),
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

  const items = navConfig.map((item) => ({
    href: item.href,
    label: t(item.labelKey),
    icon: item.icon,
    isActive: item.isActive,
  }));

  return <MobileNavBar items={items} layout="flex" alwaysExpanded />;
}
