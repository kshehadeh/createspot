import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getCreator } from "@/lib/creators";
import { getCreatorUrl } from "@/lib/utils";
import { CreatorOwnerShell } from "@/components/creator-owner-shell";

interface CreatorLayoutProps {
  children: React.ReactNode;
  params: Promise<{ creatorid: string }>;
}

async function CreatorLayoutContent({ children, params }: CreatorLayoutProps) {
  const { creatorid } = await params;
  const [session, creator] = await Promise.all([auth(), getCreator(creatorid)]);

  const isOwner = session?.user?.id === creator?.id;

  // If not owner or creator not found, just render children
  if (!isOwner || !creator) {
    return <>{children}</>;
  }

  const creatorUrl = getCreatorUrl(creator);

  return (
    <CreatorOwnerShell creatorUrl={creatorUrl}>{children}</CreatorOwnerShell>
  );
}

export default function CreatorLayout({
  children,
  params,
}: CreatorLayoutProps) {
  return (
    <Suspense fallback={<div className="flex flex-1" />}>
      <CreatorLayoutContent params={params}>{children}</CreatorLayoutContent>
    </Suspense>
  );
}
