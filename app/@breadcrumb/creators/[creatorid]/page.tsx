import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

interface ProfileBreadcrumbProps {
  params: Promise<{ creatorid: string }>;
}

export default async function ProfileBreadcrumb({
  params,
}: ProfileBreadcrumbProps) {
  const { creatorid } = await params;
  const user = await prisma.user.findUnique({
    where: { id: creatorid },
    select: { name: true },
  });

  const userName = user?.name || "Unknown";

  return (
    <Breadcrumb
      segments={[
        {
          label: userName,
          // Last item - no link since it's the current page
        },
      ]}
    />
  );
}
