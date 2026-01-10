import { getExhibitById } from "@/lib/exhibits";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

interface ExhibitBreadcrumbProps {
  params: Promise<{ exhibitId: string }>;
}

export default async function ExhibitBreadcrumb({
  params,
}: ExhibitBreadcrumbProps) {
  const { exhibitId } = await params;
  const exhibit = await getExhibitById(exhibitId);

  return (
    <Breadcrumb
      segments={[
        { label: "Exhibit", href: "/exhibition" },
        { label: exhibit?.title || "Unknown" },
      ]}
    />
  );
}
