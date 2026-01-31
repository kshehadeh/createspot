"use client";

import Link from "next/link";
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

interface MoreMenuProps {
  onSupportClick: () => void;
  moreButtonClassName: string;
}

export function MoreMenu({ onSupportClick, moreButtonClassName }: MoreMenuProps) {
  const t = useTranslations("navigation");
  const tSupport = useTranslations("contact.support");
  const promptRoute = getRoute("prompt");
  const contactRoute = getRoute("contact");

  return (
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
          onClick={onSupportClick}
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
  );
}
