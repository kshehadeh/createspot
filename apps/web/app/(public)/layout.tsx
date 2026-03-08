import Link from "@/components/link";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { CreateSpotLogo } from "@/components/create-spot-logo";
import { HtmlLangSetter } from "@/components/html-lang-setter";
import { ThemeToggle } from "@/components/theme-toggle";

const PUBLIC_MESSAGE_KEYS = [
  "common",
  "critique",
  "exhibition",
  "footer",
  "home",
  "navigation",
  "profile",
  "progression",
  "reference",
  "submission",
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
  const [locale, messages, tNav] = await Promise.all([
    getLocale(),
    getMessages(),
    getTranslations("navigation"),
  ]);

  return (
    <NextIntlClientProvider messages={pickPublicMessages(messages)}>
      <HtmlLangSetter locale={locale} />
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-12">
          <Link href="/" className="flex items-center gap-2 text-foreground">
            <CreateSpotLogo
              className="h-6 w-auto"
              base="currentColor"
              highlight="rgb(161 161 170)"
            />
            <span className="whitespace-nowrap text-2xl font-normal font-permanent-marker">
              Create Spot
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/welcome"
              className="begin-button rounded-full px-4 py-2 text-sm font-medium text-primary-foreground transition-colors"
            >
              {tNav("jumpIn")}
            </Link>
          </div>
        </header>
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
