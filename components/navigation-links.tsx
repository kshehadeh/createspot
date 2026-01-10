"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getRoute } from "@/lib/routes";

export function DashboardNavigation() {
  const pathname = usePathname();
  const exhibitionRoute = getRoute("exhibition");
  const promptRoute = getRoute("prompt");
  const aboutRoute = getRoute("about");

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const linkClassName = (path: string) => {
    return `rounded-md px-2 py-1 text-sm transition-colors ${
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
        {exhibitionRoute.label}
      </Link>
      <Link href={promptRoute.path} className={linkClassName(promptRoute.path)}>
        {promptRoute.label}
      </Link>
      <Link href={aboutRoute.path} className={linkClassName(aboutRoute.path)}>
        {aboutRoute.label}
      </Link>
    </nav>
  );
}
