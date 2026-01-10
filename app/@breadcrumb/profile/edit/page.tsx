import { auth } from "@/lib/auth";
import { Breadcrumb } from "@/components/breadcrumb";

export default async function ProfileEditBreadcrumb() {
  const session = await auth();
  const userId = session?.user?.id;
  const userName = session?.user?.name;

  return (
    <Breadcrumb
      segments={[
        { label: "Profile", href: userId ? `/profile/${userId}` : undefined },
        {
          label: userName || "Your Profile",
          href: userId ? `/profile/${userId}` : undefined,
        },
        { label: "Edit" },
      ]}
    />
  );
}
