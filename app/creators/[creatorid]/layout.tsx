import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCreatorUrl } from "@/lib/utils";
import { CreatorSidebar } from "@/components/creator-sidebar";
import { CreatorMobileNav } from "@/components/creator-mobile-nav";

interface CreatorLayoutProps {
  children: React.ReactNode;
  params: Promise<{ creatorid: string }>;
}

async function getCreator(creatorid: string) {
  return prisma.user.findFirst({
    where: {
      OR: [{ slug: creatorid }, { id: creatorid }],
    },
    select: {
      id: true,
      slug: true,
    },
  });
}

export default async function CreatorLayout({
  children,
  params,
}: CreatorLayoutProps) {
  const { creatorid } = await params;
  const [session, creator] = await Promise.all([auth(), getCreator(creatorid)]);

  const isOwner = session?.user?.id === creator?.id;

  // If not owner or creator not found, just render children
  if (!isOwner || !creator) {
    return <>{children}</>;
  }

  const creatorUrl = getCreatorUrl(creator);

  return (
    <div className="flex flex-1">
      <CreatorSidebar creatorUrl={creatorUrl} />
      <div className="flex-1 min-w-0 pb-16 md:pb-0">{children}</div>
      <CreatorMobileNav creatorUrl={creatorUrl} />
    </div>
  );
}
