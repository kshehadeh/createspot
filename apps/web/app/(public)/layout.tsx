import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { HtmlLangSetter } from "@/components/html-lang-setter";
import { PublicHeader } from "@/components/public-header";
import { auth } from "@/lib/auth";

const PUBLIC_MESSAGE_KEYS = [
  "admin",
  "categories",
  "common",
  "contact",
  "critique",
  "exhibition",
  "feed",
  "footer",
  "home",
  "imageEditor",
  "modals",
  "navigation",
  "profile",
  "progression",
  "reference",
  "submission",
  "upload",
] as const;

function pickPublicMessages(messages: Record<string, unknown>) {
  return PUBLIC_MESSAGE_KEYS.reduce<Record<string, unknown>>((picked, key) => {
    const value = messages[key];
    if (value !== undefined) {
      picked[key] = value;
    }
    return picked;
  }, {});
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, locale, messages] = await Promise.all([
    auth(),
    getLocale(),
    getMessages(),
  ]);

  return (
    <SessionProvider>
      <NextIntlClientProvider
        locale={locale}
        messages={pickPublicMessages(messages)}
      >
        <HtmlLangSetter locale={locale} />
        <div className="flex min-h-screen flex-col bg-background">
          <PublicHeader user={session?.user} />
          {children}
        </div>
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
