import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

interface AdminExhibitEditBreadcrumbProps {
  params: Promise<{ id: string }>;
}

export default async function AdminExhibitEditBreadcrumb({
  params,
}: AdminExhibitEditBreadcrumbProps) {
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
        {
          label: exhibit?.title || "Unknown",
          href: `/admin/exhibits/${id}/edit`,
        },
        { label: "Edit" },
      ]}
    />
  );
}
