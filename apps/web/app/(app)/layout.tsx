import { Suspense } from "react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { DeferredAnalytics } from "@/components/deferred-analytics";
import { GlobalHints } from "@/components/global-hints";
import { AppVersionFooter } from "@/components/app-version-footer";
import { Header } from "@/components/header";
import { HtmlLangSetter } from "@/components/html-lang-setter";
import { UrlTracker } from "@/components/url-tracker";
import { auth } from "@/lib/auth";
import { getTutorialData } from "@/lib/get-tutorial-data";

async function GlobalHintsWithData({ userId }: { userId: string | undefined }) {
  if (!userId) return null;
  const tutorialData = await getTutorialData(userId);
  return <GlobalHints tutorialData={tutorialData} userId={userId} />;
}

async function AppLayoutContent({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <HtmlLangSetter locale={locale} />
      <div className="flex min-h-screen flex-col bg-background">
        <Header user={session?.user} />
        {children}
        <AppVersionFooter />
      </div>
      <Suspense fallback={null}>
        <GlobalHintsWithData userId={session?.user?.id} />
      </Suspense>
      <UrlTracker />
      <DeferredAnalytics />
      <SpeedInsights />
    </NextIntlClientProvider>
  );
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <SessionProvider session={session}>
      <Suspense
        fallback={<div className="flex min-h-screen flex-col bg-background" />}
      >
        <AppLayoutContent session={session}>{children}</AppLayoutContent>
      </Suspense>
    </SessionProvider>
  );
}
