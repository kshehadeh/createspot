import { auth } from "@/lib/auth";
import { Breadcrumb } from "@/components/breadcrumb";

export default async function PortfolioEditBreadcrumb() {
  const session = await auth();
  const userId = session?.user?.id;
  const userName = session?.user?.name;

  return (
    <Breadcrumb
      segments={[
        {
          label: "Portfolio",
          href: userId ? `/portfolio/${userId}` : undefined,
        },
        {
          label: userName || "Your Portfolio",
          href: userId ? `/portfolio/${userId}` : undefined,
        },
        { label: "Edit" },
      ]}
    />
  );
}
