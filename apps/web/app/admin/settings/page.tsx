import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import { PageLayout } from "@/components/page-layout";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/welcome");
  }

  if (!session.user.isAdmin) {
    redirect("/");
  }

  const t = await getTranslations("admin.settings");
  const settings = await getSiteSettings();

  const [exhibits, heroSubmission] = await Promise.all([
    prisma.exhibit.findMany({
      select: { id: true, title: true, startTime: true },
      orderBy: { startTime: "desc" },
    }),
    settings.homepageHeroSubmissionId
      ? prisma.submission.findFirst({
          where: {
            id: settings.homepageHeroSubmissionId,
            shareStatus: "PUBLIC",
            imageUrl: { not: null },
          },
          select: {
            id: true,
            title: true,
            imageUrl: true,
            imageFocalPoint: true,
            user: { select: { id: true, name: true, image: true } },
          },
        })
      : Promise.resolve(null),
  ]);

  const heroSubmissionForForm = heroSubmission
    ? {
        ...heroSubmission,
        imageFocalPoint: heroSubmission.imageFocalPoint as {
          x: number;
          y: number;
        } | null,
      }
    : null;

  return (
    <PageLayout maxWidth="max-w-4xl" className="w-full">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>

        <Link
          href="/admin/exhibits/new"
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground"
        >
          {t("createNewExhibit")}
        </Link>
      </div>

      <SettingsForm
        exhibits={exhibits.map((e) => ({ id: e.id, title: e.title }))}
        initialSettings={settings}
        initialHeroSubmission={heroSubmissionForForm}
      />
    </PageLayout>
  );
}
