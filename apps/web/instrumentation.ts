import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // If NODE_OPTIONS=--inspect was set in Vercel (or elsewhere), close the inspector
    // in production to avoid ongoing overhead. Prefer removing NODE_OPTIONS in Vercel.
    if (process.env.NODE_ENV === "production") {
      try {
        const inspector = await import("node:inspector");
        if (inspector.url()) {
          inspector.close();
        }
      } catch {
        // ignore
      }
    }
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Automatically captures all unhandled server-side request errors
export const onRequestError = Sentry.captureRequestError;
