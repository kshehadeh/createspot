"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { User, Briefcase, MessageSquare } from "lucide-react";
import { MobileNavBar } from "@/components/mobile-nav-bar";

interface CreatorMobileNavProps {
  creatorUrl: string;
}

export function CreatorMobileNav({ creatorUrl }: CreatorMobileNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("creatorNav");
  const isPublicView = searchParams?.get("view") === "public";

  if (isPublicView) {
    return null;
  }

  const items = [
    {
      href: creatorUrl,
      label: t("profile"),
      icon: User,
      isActive:
        (pathname === creatorUrl || pathname === `${creatorUrl}/edit`) &&
        pathname !== `${creatorUrl}/critiques`,
    },
    {
      href: `${creatorUrl}/critiques`,
      label: t("critiques"),
      icon: MessageSquare,
      isActive: pathname === `${creatorUrl}/critiques`,
    },
    {
      href: `${creatorUrl}/portfolio`,
      label: t("portfolio"),
      icon: Briefcase,
      isActive:
        pathname.startsWith(`${creatorUrl}/portfolio`) ||
        pathname.startsWith(`${creatorUrl}/collections`),
    },
  ];

  return <MobileNavBar items={items} layout="flex" alwaysExpanded />;
}
