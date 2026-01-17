import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Permanent_Marker } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import { GlobalHints } from "@/components/global-hints";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

export default async function RootLayout({
  children,
  breadcrumb,
}: {
  children: React.ReactNode;
  breadcrumb?: React.ReactNode;
}) {
  const session = await auth();
  const locale = await getLocale();
  const messages = await getMessages();

  // Fetch tutorial data for global hints
  let tutorialData = null;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tutorial: true },
    });
    tutorialData = user?.tutorial;
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${permanentMarker.variable} antialiased overflow-x-hidden`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider messages={messages}>
            <SessionProvider>
              <div className="flex min-h-screen flex-col bg-background">
                <Header user={session?.user} />
                {breadcrumb}
                {children}
              </div>
              <GlobalHints
                tutorialData={tutorialData}
                userId={session?.user?.id}
              />
              <Analytics />
            </SessionProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
