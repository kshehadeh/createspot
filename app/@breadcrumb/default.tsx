"use client";

import { usePathname } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { EXHIBITION_CONFIGS } from "@/lib/exhibition-constants";

// Static breadcrumbs for routes without dynamic data needs
function getStaticBreadcrumbs(pathname: string) {
  // Homepage - no breadcrumbs
  if (pathname === "/") return null;

  // Exhibition routes (static ones)
  if (pathname === "/exhibition/gallery") {
    return [
      { label: "Exhibit", href: "/exhibition" },
      { label: "Grid", icon: EXHIBITION_CONFIGS.gallery.icon },
    ];
  }
  if (pathname === "/exhibition/constellation") {
    return [
      { label: "Exhibit", href: "/exhibition" },
      { label: "Constellation", icon: EXHIBITION_CONFIGS.constellation.icon },
    ];
  }
  if (pathname === "/exhibition/global") {
    return [
      { label: "Exhibit", href: "/exhibition" },
      { label: "Map", icon: EXHIBITION_CONFIGS.global.icon },
    ];
  }
  if (pathname === "/exhibition") {
    return [{ label: "Exhibit" }];
  }

  // Prompt routes
  if (pathname === "/prompt/play") {
    return [{ label: "Prompts", href: "/prompt" }, { label: "Play" }];
  }
  if (pathname === "/prompt/history") {
    return [{ label: "Prompts", href: "/prompt" }, { label: "History" }];
  }
  if (pathname === "/prompt/this-week") {
    return [{ label: "Prompts", href: "/prompt" }, { label: "This Week" }];
  }
  if (pathname === "/prompt") {
    return [{ label: "Prompts" }];
  }

  // Admin routes (static ones)
  if (pathname === "/admin/users") {
    return [{ label: "Admin", href: "/admin" }, { label: "Users" }];
  }
  if (pathname === "/admin/exhibits/new") {
    return [
      { label: "Admin", href: "/admin" },
      { label: "Exhibits", href: "/admin/exhibits" },
      { label: "New" },
    ];
  }
  if (pathname === "/admin/exhibits") {
    return [{ label: "Admin", href: "/admin" }, { label: "Exhibits" }];
  }
  if (pathname === "/admin") {
    return [{ label: "Admin" }];
  }

  // Profile edit (no dynamic user name needed)
  if (pathname === "/profile/edit") {
    return [{ label: "Profile" }, { label: "Edit" }];
  }

  // Portfolio edit
  if (pathname === "/portfolio/edit") {
    return [{ label: "Portfolio" }, { label: "Edit" }];
  }

  // Favorites
  if (pathname === "/favorites") {
    return [{ label: "Favorites" }];
  }

  // About
  if (pathname === "/about") {
    return [{ label: "About" }];
  }
  if (pathname.startsWith("/about/")) {
    return [{ label: "About", href: "/about" }, { label: "Details" }];
  }

  // Auth routes - no breadcrumbs
  if (pathname.startsWith("/auth")) {
    return null;
  }

  // Default fallback - try to generate from path segments
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0) {
    return segments.map((segment, index) => {
      const isLast = index === segments.length - 1;
      const href = isLast
        ? undefined
        : "/" + segments.slice(0, index + 1).join("/");
      // Capitalize first letter
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);
      return { label, href };
    });
  }

  return null;
}

export default function DefaultBreadcrumb() {
  const pathname = usePathname();
  const segments = getStaticBreadcrumbs(pathname);

  if (!segments) {
    return null;
  }

  return <Breadcrumb segments={segments} />;
}
