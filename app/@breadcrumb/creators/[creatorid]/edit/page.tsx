import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Breadcrumb } from "@/components/breadcrumb";

interface ProfileEditBreadcrumbProps {
  params: Promise<{ creatorid: string }>;
}

export default async function ProfileEditBreadcrumb({
  params,
}: ProfileEditBreadcrumbProps) {
  const { creatorid } = await params;
  const session = await auth();
  const t = await getTranslations("navigation");
  const userName = session?.user?.name;

  return (
    <Breadcrumb
      segments={[
        {
          label: userName || "Your Profile",
          href: `/creators/${creatorid}`,
        },
        { label: t("edit") },
      ]}
    />
  );
}
