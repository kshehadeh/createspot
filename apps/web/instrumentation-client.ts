import * as Sentry from "@sentry/nextjs";
import { getSentryEnvironment } from "@/lib/sentry-environment";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const hasValidDsn = dsn && !dsn.startsWith("___");

if (hasValidDsn) {
  Sentry.init({
    dsn,

    environment: getSentryEnvironment(),

    sendDefaultPii: true,

    // 100% in dev, 10% in production
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    // Session Replay: 10% of all sessions, 100% of sessions with errors
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    enableLogs: true,

    // Replay integration is lazy-loaded below to reduce initial bundle size (~300KB savings)
    integrations: [],
  });

  // Lazy load replay integration after initial page load to reduce bundle size
  // This defers loading the rrweb session replay code until after hydration
  if (typeof window !== "undefined") {
    const loadReplay = async () => {
      try {
        const replay = await Sentry.lazyLoadIntegration("replayIntegration");
        if (replay) {
          Sentry.addIntegration(replay);
        }
      } catch {
        // Silently fail if lazy loading is not supported or blocked
      }
    };

    // Use requestIdleCallback for non-critical loading
    if ("requestIdleCallback" in window) {
      (
        window as typeof window & {
          requestIdleCallback: (cb: () => void) => void;
        }
      ).requestIdleCallback(loadReplay);
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(loadReplay, 1000);
    }
  }
}

// Hook into App Router navigation transitions (App Router only)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
