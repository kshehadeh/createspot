import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Breadcrumb } from "@/components/breadcrumb";

export default async function ProfileEditBreadcrumb() {
  const session = await auth();
  const t = await getTranslations("navigation");
  const userId = session?.user?.id;
  const userName = session?.user?.name;

  return (
    <Breadcrumb
      segments={[
        {
          label: userName || "Your Profile",
          href: userId ? `/profile/${userId}` : undefined,
        },
        { label: t("edit") },
      ]}
    />
  );
}
