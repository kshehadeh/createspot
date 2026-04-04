/**
 * Value for Sentry `environment`. Set `SENTRY_ENVIRONMENT` in Vercel for an explicit tag.
 * `VERCEL_ENV` is available on server/edge; for browser-reported events, also set
 * `NEXT_PUBLIC_VERCEL_ENV` to the same value (e.g. production / preview / development).
 */
export function getSentryEnvironment(): string {
  const explicit = process.env.SENTRY_ENVIRONMENT;
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_ENV ?? process.env.NEXT_PUBLIC_VERCEL_ENV;
  if (vercel) return vercel;
  return process.env.NODE_ENV === "production" ? "production" : "development";
}
