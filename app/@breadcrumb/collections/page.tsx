import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { buildBreadcrumbFromParent } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function CollectionsBreadcrumb() {
  const session = await auth();
  if (session?.user?.id) {
    redirect(`/creators/${session.user.id}/collections`);
  }
  const t = await getTranslations("navigation");
  const segments = buildBreadcrumbFromParent("/collections", [], t);
  return <Breadcrumb segments={segments} />;
}
