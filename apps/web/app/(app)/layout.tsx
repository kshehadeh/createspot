import { Suspense } from "react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { DeferredAnalytics } from "@/components/deferred-analytics";
import { GlobalHints } from "@/components/global-hints";
import { AppLayoutClient } from "@/components/app-layout-client";
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
        <AppLayoutClient user={session?.user}>
          <Header user={session?.user} />
          <div className="flex min-h-0 flex-1 flex-col pt-[max(0.5rem,env(safe-area-inset-top,0px))] pe-[max(3.5rem,env(safe-area-inset-right,0px))] md:pt-0 md:pe-0">
            {children}
          </div>
          <AppVersionFooter />
        </AppLayoutClient>
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
