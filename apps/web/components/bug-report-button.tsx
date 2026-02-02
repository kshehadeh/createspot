"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SupportFormModal } from "@/components/contact/support-form-modal";
import { Bug } from "lucide-react";

interface BugReportButtonProps {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
  onOpen?: () => void;
}

export function BugReportButton({
  variant = "outline",
  size = "default",
  className = "",
  showLabel = true,
  onOpen,
}: BugReportButtonProps) {
  const t = useTranslations("contact.support");
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    setIsOpen(true);
    onOpen?.();
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant={variant}
        size={size}
        className={className}
        aria-label={t("cta")}
      >
        <Bug className="h-4 w-4" />
        {showLabel && <span className="ml-2">{t("cta")}</span>}
      </Button>
      <SupportFormModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
