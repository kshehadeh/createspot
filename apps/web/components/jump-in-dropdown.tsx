"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

export function JumpInDropdown() {
  const t = useTranslations("navigation");
  const router = useRouter();
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = useCallback(() => {
    setIsClicked(true);
    setTimeout(() => {
      router.push("/welcome");
    }, 200);
  }, [router]);

  return (
    <Button
      variant="default"
      size="default"
      className={`begin-button ${isClicked ? "clicked" : ""}`}
      onClick={handleClick}
    >
      {t("jumpIn")}
    </Button>
  );
}
