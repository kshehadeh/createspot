"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getRoute } from "@/lib/routes";

interface SidebarLink {
  id: string;
  href: string;
  labelKey: string;
  isExternal?: boolean;
}

interface AboutSidebarProps {
  currentSection?: string;
}

export function AboutSidebar({ currentSection }: AboutSidebarProps) {
  const t = useTranslations("about");
  const featuresRoute = getRoute("aboutFeatures");

  const links: SidebarLink[] = [
    { id: "purpose", href: "#purpose", labelKey: "purpose.title" },
    {
      id: "features",
      href: featuresRoute.path,
      labelKey: "features.title",
      isExternal: true,
    },
    {
      id: "organization",
      href: "#organization",
      labelKey: "organization.title",
    },
    {
      id: "prompt-inspiration",
      href: "#prompt-inspiration",
      labelKey: "promptInspiration.title",
    },
    { id: "badges", href: "#badges", labelKey: "badges.title" },
    {
      id: "protecting-your-work",
      href: "#protecting-your-work",
      labelKey: "protectingYourWork.title",
    },
  ];

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <nav className="hidden lg:block sticky top-24 space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4">
        {t("sidebar.title")}
      </h3>
      <ul className="space-y-1">
        {links.map((link) => {
          const isActive = currentSection === link.id;
          return (
            <li key={link.id}>
              <Link
                href={link.href}
                onClick={(e) => handleClick(e, link.href)}
                className={cn(
                  "block px-3 py-2 text-sm rounded-md transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {t(link.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
