import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CollectionsRedirectPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  // Redirect to the user's collections page
  redirect(`/creators/${session.user.id}/collections`);
}
