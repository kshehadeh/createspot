import { createTranslator } from "next-intl";
import type { Locale } from "@/i18n/config";
import { defaultLocale, isValidLocale } from "@/i18n/config";

/**
 * Loads translation messages for a specific locale.
 * This is used outside of Next.js request context (e.g., in workflows, email templates).
 *
 * @param locale - The locale code (e.g., "en", "es")
 * @returns The translation messages object for the specified locale
 */
async function loadTranslations(
  locale: string,
): Promise<Record<string, unknown>> {
  const validLocale: Locale = isValidLocale(locale)
    ? (locale as Locale)
    : defaultLocale;

  const messages = (await import(`../../messages/${validLocale}.json`)).default;
  return messages;
}

/**
 * Creates a translation function for a specific namespace and locale.
 * Uses next-intl's createTranslator to work outside of Next.js request context.
 * This is the same translation system used throughout the app, just without request context.
 *
 * @param locale - The locale code
 * @param namespace - The translation namespace (e.g., "email", "common")
 * @returns A translation function that accepts a key and optional variables
 */
export async function getEmailTranslations(
  locale: string,
  namespace?: string,
): Promise<(key: string, values?: Record<string, string | number>) => string> {
  const messages = await loadTranslations(locale);
  const validLocale: Locale = isValidLocale(locale)
    ? (locale as Locale)
    : defaultLocale;

  // Use next-intl's createTranslator - works outside request context
  const t = createTranslator({
    locale: validLocale,
    messages,
    namespace,
  });

  // Wrap the translator to match our expected signature
  // The translator is strongly typed, so we need to use type assertion
  return (key: string, values?: Record<string, string | number>): string => {
    return (t as (key: string, values?: Record<string, unknown>) => string)(
      key,
      values as Record<string, unknown>,
    );
  };
}
