"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Breadcrumb } from "@/components/breadcrumb";
import { getBreadcrumbSegments } from "@/lib/routes";

export default function InspireDefaultBreadcrumb() {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const segments = getBreadcrumbSegments(pathname, t);

  if (!segments) {
    return null;
  }

  return <Breadcrumb key={pathname} segments={segments} />;
}
