import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Dynamic RSC that checks auth and redirects logged-in users.
 * Renders nothing for anonymous visitors. Wrapped in Suspense by the
 * parent so the cached page shell streams instantly.
 */
export async function HomeAuthGate() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  return null;
}
