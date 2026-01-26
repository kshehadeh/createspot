"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { getRoute } from "@/lib/routes";

interface ContactButtonProps {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export function ContactButton({
  variant = "outline",
  size = "default",
  className = "",
  showLabel = true,
}: ContactButtonProps) {
  const t = useTranslations("navigation");
  const contactRoute = getRoute("contact");

  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={className}
      aria-label={t("contact")}
    >
      <Link href={contactRoute.path}>
        <Mail className="h-4 w-4" />
        {showLabel && <span className="ml-2">{t("contact")}</span>}
      </Link>
    </Button>
  );
}
