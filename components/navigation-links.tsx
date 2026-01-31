"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { getRoute } from "@/lib/routes";
import { Ellipsis } from "lucide-react";
import { useState } from "react";
import { SupportFormModal } from "@/components/contact/support-form-modal";

const moreButtonClassName =
  "rounded-md px-2 py-1 text-sm transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-full text-muted-foreground hover:bg-accent hover:text-accent-foreground";

const MoreMenu = dynamic(
  () =>
    import("./navigation-links-more-menu").then((mod) => ({
      default: mod.MoreMenu,
    })),
  {
    ssr: false,
    loading: () => (
      <div className={`flex items-center gap-1 ${moreButtonClassName}`}>
        <span>More</span>
        <Ellipsis className="h-4 w-4" />
      </div>
    ),
  },
);

export function DashboardNavigation() {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const exhibitionRoute = getRoute("exhibition");
  const creatorsRoute = getRoute("creators");
  const aboutRoute = getRoute("about");
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

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
    <>
      <nav className="flex items-center gap-4">
        <Link
          href={exhibitionRoute.path}
          className={linkClassName(exhibitionRoute.path)}
        >
          {t("exhibits")}
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
        <MoreMenu
          onSupportClick={() => setIsSupportModalOpen(true)}
          moreButtonClassName={moreButtonClassName}
        />
      </nav>
      <SupportFormModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </>
  );
}
