import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCreatorUrl } from "@/lib/utils";

interface PortfolioEditRedirectProps {
  params: Promise<{ creatorid: string }>;
}

export default async function PortfolioEditRedirect({
  params,
}: PortfolioEditRedirectProps) {
  const { creatorid } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ slug: creatorid }, { id: creatorid }],
    },
    select: {
      id: true,
      slug: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  if (session.user.id !== user.id) {
    redirect(`/creators/${session.user.id}/portfolio`);
  }

  redirect(`${getCreatorUrl(user)}/portfolio`);
}
