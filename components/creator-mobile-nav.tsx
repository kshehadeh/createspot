"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { User, Briefcase, MessageSquare, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreatorMobileNavProps {
  creatorUrl: string;
}

export function CreatorMobileNav({ creatorUrl }: CreatorMobileNavProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("creatorNav");
  const isPublicView = searchParams?.get("view") === "public";

  if (isPublicView) {
    return null;
  }

  const navItems = [
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

  const activeItem = navItems.find((item) => item.isActive) || navItems[0];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Navigation bar */}
      <div className="relative border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {isExpanded ? (
          <nav className="p-2">
            <ul className="flex items-center justify-around">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsExpanded(false)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg px-4 py-2 text-xs font-medium transition-colors",
                      item.isActive
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <item.icon
                      className={cn("h-5 w-5", item.isActive && "text-primary")}
                    />
                    {item.label}
                    {item.isActive && (
                      <span className="h-1 w-1 rounded-full bg-primary" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-foreground"
          >
            <activeItem.icon className="h-4 w-4" />
            {activeItem.label}
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
