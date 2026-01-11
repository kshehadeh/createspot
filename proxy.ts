import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, isValidLocale, locales } from "@/i18n/config";

const LOCALE_COOKIE = "NEXT_LOCALE";

// Parse Accept-Language header and return the best matching locale
function getPreferredLocale(acceptLanguage: string | null): string {
  if (!acceptLanguage) return defaultLocale;

  // Parse the Accept-Language header
  // Format: "en-US,en;q=0.9,es;q=0.8"
  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, qValue] = lang.trim().split(";q=");
      return {
        code: code.split("-")[0].toLowerCase(), // Get just the language code (e.g., "en" from "en-US")
        quality: qValue ? Number.parseFloat(qValue) : 1,
      };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find the first matching supported locale
  for (const { code } of languages) {
    if (locales.includes(code as (typeof locales)[number])) {
      return code;
    }
  }

  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Check if locale cookie exists
  const localeCookie = request.cookies.get(LOCALE_COOKIE)?.value;

  // If cookie exists and is valid, we're done
  if (localeCookie && isValidLocale(localeCookie)) {
    return response;
  }

  // No valid cookie - detect from Accept-Language header
  const acceptLanguage = request.headers.get("accept-language");
  const detectedLocale = getPreferredLocale(acceptLanguage);

  // Set the locale cookie for future requests
  response.cookies.set(LOCALE_COOKIE, detectedLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });

  return response;
}

export const config = {
  // Match all paths except static files and API routes that don't need locale
  matcher: [
    // Match all paths except:
    // - _next (Next.js internals)
    // - api (API routes - though we may want some translated)
    // - static files (favicon, images, etc.)
    "/((?!_next|api|.*\\..*).*)",
  ],
};
