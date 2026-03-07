import { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { DeferredAnalytics } from "@/components/deferred-analytics";
import { GlobalHints } from "@/components/global-hints";
import { Header } from "@/components/header";
import { HtmlLangSetter } from "@/components/html-lang-setter";
import { UrlTracker } from "@/components/url-tracker";
import { auth } from "@/lib/auth";
import { getTutorialData } from "@/lib/get-tutorial-data";

async function AppLayoutContent({
  children,
  breadcrumb,
}: {
  children: React.ReactNode;
  breadcrumb?: React.ReactNode;
}) {
  const [session, locale, messages] = await Promise.all([
    auth(),
    getLocale(),
    getMessages(),
  ]);

  const tutorialData = await getTutorialData(session?.user?.id);

  return (
    <NextIntlClientProvider messages={messages}>
      <HtmlLangSetter locale={locale} />
      <div className="flex min-h-screen flex-col bg-background">
        <Header user={session?.user} />
        {breadcrumb != null ? (
          <Suspense fallback={null}>{breadcrumb}</Suspense>
        ) : null}
        {children}
      </div>
      <GlobalHints tutorialData={tutorialData} userId={session?.user?.id} />
      <UrlTracker />
      <DeferredAnalytics />
      <SpeedInsights />
    </NextIntlClientProvider>
  );
}

export default function AppLayout({
  children,
  breadcrumb,
}: {
  children: React.ReactNode;
  breadcrumb?: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <Suspense
        fallback={<div className="flex min-h-screen flex-col bg-background" />}
      >
        <AppLayoutContent breadcrumb={breadcrumb}>{children}</AppLayoutContent>
      </Suspense>
    </SessionProvider>
  );
}
