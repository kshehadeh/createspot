import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";

interface AdminExhibitContentBreadcrumbProps {
  params: Promise<{ id: string }>;
}

export default async function AdminExhibitContentBreadcrumb({
  params,
}: AdminExhibitContentBreadcrumbProps) {
  const { id } = await params;
  const exhibit = await prisma.exhibit.findUnique({
    where: { id },
    select: { title: true },
  });

  return (
    <Breadcrumb
      segments={[
        { label: "Admin", href: "/admin" },
        { label: "Exhibits", href: "/admin/exhibits" },
        { label: exhibit?.title || "Unknown", href: `/exhibition/${id}` },
        { label: "Content" },
      ]}
    />
  );
}
