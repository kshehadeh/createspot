import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Permanent_Marker } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import { GlobalHints } from "@/components/global-hints";
import { UrlTracker } from "@/components/url-tracker";
import { DeferredAnalytics } from "@/components/deferred-analytics";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { HtmlLangSetter } from "@/components/html-lang-setter";
import { auth } from "@/lib/auth";
import { getTutorialData } from "@/lib/get-tutorial-data";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const permanentMarker = Permanent_Marker({
  variable: "--font-permanent-marker",
  subsets: ["latin"],
  weight: "400",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: "Create Spot",
  description:
    "A creative community for artists and writers to share their work, build portfolios, and participate in weekly creative prompts.",
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
  openGraph: {
    title: "Create Spot",
    description:
      "A creative community for artists and writers to share their work, build portfolios, and participate in weekly creative prompts.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Spot",
    description:
      "A creative community for artists and writers to share their work, build portfolios, and participate in weekly creative prompts.",
  },
};

async function RootLayoutContent({
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

export default function RootLayout({
  children,
  breadcrumb,
}: {
  children: React.ReactNode;
  breadcrumb?: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${permanentMarker.variable} antialiased overflow-x-hidden`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SessionProvider>
            <Suspense
              fallback={
                <div className="flex min-h-screen flex-col bg-background" />
              }
            >
              <RootLayoutContent breadcrumb={breadcrumb}>
                {children}
              </RootLayoutContent>
            </Suspense>
          </SessionProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
