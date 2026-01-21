"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { getRoute } from "@/lib/routes";

export function DashboardNavigation() {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const exhibitionRoute = getRoute("exhibition");
  const promptRoute = getRoute("prompt");
  const creatorsRoute = getRoute("creators");
  const aboutRoute = getRoute("about");
  const contactRoute = getRoute("contact");

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const linkClassName = (path: string) => {
    return `rounded-md px-2 py-1 text-sm transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-full ${
      isActive(path)
        ? "bg-accent text-accent-foreground font-medium"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    }`;
  };

  return (
    <nav className="flex items-center gap-4">
      <Link
        href={exhibitionRoute.path}
        className={linkClassName(exhibitionRoute.path)}
      >
        {t("exhibits")}
      </Link>
      <Link href={promptRoute.path} className={linkClassName(promptRoute.path)}>
        {t("prompts")}
      </Link>
      <Link
        href={creatorsRoute.path}
        className={linkClassName(creatorsRoute.path)}
      >
        {t("creators")}
      </Link>
      <Link href={aboutRoute.path} className={linkClassName(aboutRoute.path)}>
        {t("about")}
      </Link>
      <Link
        href={contactRoute.path}
        className={linkClassName(contactRoute.path)}
      >
        {t("contact")}
      </Link>
    </nav>
  );
}
