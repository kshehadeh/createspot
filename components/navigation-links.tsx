"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { getRoute } from "@/lib/routes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ellipsis, Bug, Mail } from "lucide-react";
import { useState } from "react";
import { SupportFormModal } from "@/components/contact/support-form-modal";

export function DashboardNavigation() {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const tSupport = useTranslations("contact.support");
  const exhibitionRoute = getRoute("exhibition");
  const promptRoute = getRoute("prompt");
  const creatorsRoute = getRoute("creators");
  const aboutRoute = getRoute("about");
  const contactRoute = getRoute("contact");
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

  const moreButtonClassName = `rounded-md px-2 py-1 text-sm transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-full text-muted-foreground hover:bg-accent hover:text-accent-foreground`;

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
        <DropdownMenu>
          <DropdownMenuTrigger className={moreButtonClassName}>
            <div className="flex items-center gap-1">
              {t("more")}
              <Ellipsis className="h-4 w-4" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={promptRoute.path} className="flex items-center gap-2">
                {promptRoute.icon && <promptRoute.icon className="h-4 w-4" />}
                {t("prompts")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsSupportModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Bug className="h-4 w-4" />
              {tSupport("cta")}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={contactRoute.path}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                {t("contact")}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
      <SupportFormModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </>
  );
}
