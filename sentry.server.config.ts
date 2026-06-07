/**
 * Sentry Server Configuration
 *
 * Error monitoring for the server-side (API routes, server components, etc.).
 * Only enabled when SENTRY_DSN is set in environment.
 * Safe no-op when not configured — no data sent.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || "development";

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: environment === "production" ? 0.1 : 0.0,
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
  console.log("[Sentry] Server DSN not configured — error monitoring disabled");
}
