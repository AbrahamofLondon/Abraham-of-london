/**
 * Sentry Client Configuration
 *
 * Error monitoring for the browser/client-side.
 * Only enabled when SENTRY_DSN is set in environment.
 * Safe no-op when not configured — no data sent.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || "development";

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: environment === "production" ? 0.1 : 0.0,
    replaysSessionSampleRate: environment === "production" ? 0.1 : 0.0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Only capture errors in production-like environments
    enabled: environment === "production" || environment === "staging",
    // Prevent PII leakage
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers["cookie"];
        delete event.request.headers["authorization"];
      }
      return event;
    },
  });
} else {
  console.log("[Sentry] Client DSN not configured — error monitoring disabled");
}
