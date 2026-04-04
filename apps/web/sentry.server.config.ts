import * as Sentry from "@sentry/nextjs";
import { getSentryEnvironment } from "@/lib/sentry-environment";

const dsn = process.env.SENTRY_DSN;
const hasValidDsn = dsn && !dsn.startsWith("___");

if (hasValidDsn) {
  Sentry.init({
    dsn,

    environment: getSentryEnvironment(),

    sendDefaultPii: true,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    enableLogs: true,
  });
}
