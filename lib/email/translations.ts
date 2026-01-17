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
  const validLocale: Locale =
    isValidLocale(locale) ? (locale as Locale) : defaultLocale;

  const messages = (await import(`../../messages/${validLocale}.json`)).default;
  return messages;
}

/**
 * Creates a translation function for a specific namespace and locale.
 * This mimics the behavior of next-intl's getTranslations but works outside request context.
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

  const namespaceMessages = namespace
    ? (messages[namespace] as Record<string, unknown> | undefined) ?? {}
    : (messages as Record<string, unknown>);

  return (key: string, values?: Record<string, string | number>): string => {
    // Handle nested keys like "favoriteNotification.title"
    const keys = key.split(".");
    let translation: unknown = namespaceMessages;

    // Traverse the object using the key path
    for (const k of keys) {
      if (
        translation &&
        typeof translation === "object" &&
        k in translation
      ) {
        translation = (translation as Record<string, unknown>)[k];
      } else {
        // Key not found, return the original key
        return key;
      }
    }

    // Ensure we have a string
    if (typeof translation !== "string") {
      return key;
    }

    // Replace variables in the format {variableName}
    if (values) {
      for (const [varName, varValue] of Object.entries(values)) {
        translation = translation.replace(
          new RegExp(`\\{${varName}\\}`, "g"),
          String(varValue),
        );
      }
    }

    return translation;
  };
}
