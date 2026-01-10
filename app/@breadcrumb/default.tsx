"use client";

import { usePathname } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { getBreadcrumbSegments } from "@/lib/routes";

export default function DefaultBreadcrumb() {
  const pathname = usePathname();
  const segments = getBreadcrumbSegments(pathname);

  if (!segments) {
    return null;
  }

  // Key prop forces remount on pathname change, ensuring breadcrumb updates
  return <Breadcrumb key={pathname} segments={segments} />;
}
