"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Breadcrumb } from "@/components/breadcrumb";
import { getBreadcrumbSegments } from "@/lib/routes";

export default function DefaultBreadcrumb() {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const segments = getBreadcrumbSegments(pathname, t);

  if (!segments) {
    return null;
  }

  // Key prop forces remount on pathname change, ensuring breadcrumb updates
  return <Breadcrumb key={pathname} segments={segments} />;
}
