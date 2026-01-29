import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveShortCode } from "@/lib/short-url";
import { ShortUrlRedirect } from "@/components/short-url-redirect";

export const dynamic = "force-dynamic";

interface ShortUrlPageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({
  params,
}: ShortUrlPageProps): Promise<Metadata> {
  const { code } = await params;
  const resolved = await resolveShortCode(code);
  if (!resolved) {
    return { title: "Not Found | Create Spot" };
  }
  return resolved.metadata;
}

export default async function ShortUrlPage({ params }: ShortUrlPageProps) {
  const { code } = await params;
  const resolved = await resolveShortCode(code);
  if (!resolved) {
    notFound();
  }
  return <ShortUrlRedirect to={resolved.canonicalPath} />;
}
