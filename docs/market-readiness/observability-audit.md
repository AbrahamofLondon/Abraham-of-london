# Observability Audit

**Date:** 2026-05-07
**Scope:** Can the system answer who started, where they dropped, who converted, and what went wrong?

---

## Executive Verdict

The system has **strong journey and funnel instrumentation** -- substantially above what most early-stage products ship. The decision-journey pipeline (client emitter -> API -> Prisma/DB) is production-ready and persists to a real database. GA4 is wired in for both routers. Hesitation and behavioural friction detection is unusually sophisticated.

**However, three critical gaps remain:**

1. **No error monitoring service** -- Sentry DSN is referenced in config but never installed (no `@sentry/nextjs` package, no `sentry.*.config.ts` files). Errors go to `console.error` and vanish.
2. **Session tracker DB persistence is stubbed** -- `ConstitutionalSessionTracker` (`lib/analytics/session-tracker.ts`) has all Prisma calls commented out with "STUB: constitutionalSession model not in schema (C2 debt)". Session data lives only in an in-memory `Map` and is lost on every deploy/restart.
3. **The analytics event API is a no-op in production** -- `pages/api/analytics/event.ts` receives events from `AnalyticsProvider` but only logs in dev and returns 200 without storing anything. Events sent via the `AnalyticsContext` are silently discarded in production.

---

## Capability Matrix

| # | Capability | Implemented? | How | Gaps |
|---|-----------|:---:|-----|------|
| 1 | **Page views** | YES | GA4 via `@next/third-parties/google` (app router) + gtag script (pages router). `AnalyticsContext` also fires `page_view` events. | GA4 works. AnalyticsContext events are discarded in production (event API is a no-op). |
| 2 | **Journey / funnel tracking** | YES | `lib/analytics/decision-journey.ts` persists to `DecisionJourneyEvent` (Prisma model, confirmed in schema). Client emitter uses `sendBeacon` for reliability. 65+ named journey stages. | Fully functional. This is the strongest part of the stack. |
| 3 | **Funnel drop-off detection** | YES | `getDropOffMap()` computes drop-off count and rate at each transition. `trackDropoff()` fires on page unload if user spent >5s. `trackDiagnosticAbandon()` captures stage index. | Operational. Can answer "where do users drop?" with DB queries. |
| 4 | **Conversion tracking** | YES | `trackExecPurchase()`, `trackAssetPurchase()`, `trackStrategyCompleted()` etc. all persist via journey pipeline. Revenue-per-path reporting exists (`getRevenueByPath()`). | Can answer "who converted?" and "how much revenue per path?" |
| 5 | **Hesitation / friction detection** | YES | `lib/analytics/hesitation.ts` detects DOUBT, CONFUSION, OVERLOAD, PRICE_RESISTANCE via idle time, scroll-up patterns, CTA hover duration, exit-after-CTA-view. | Unusually sophisticated. Fires as journey events to the same DB pipeline. |
| 6 | **Conviction state machine** | YES | 5-state progression: UNDEFINED -> RECOGNISED -> CLARIFIED -> PRICED -> COMMITTED. Stored in sessionStorage, never regresses. Attached to every journey event. | Client-side only (sessionStorage). Lost on new tab/device. Not linked to server-side user identity. |
| 7 | **CTA click/dwell tracking** | YES | `ConversionIntelligenceTracker` component (mounted in `Layout.tsx`) tracks pointer hover >900ms on any `a`/`button`, repeated scroll, exit-after-hover. | Global and automatic. Working. |
| 8 | **GA4 custom events** | YES | `lib/analytics/track.ts` enriches every event with user_type, device, traffic_source, returning_user, session_depth. Fires via `window.gtag`. | Depends on `NEXT_PUBLIC_GA_MEASUREMENT_ID` being set. |
| 9 | **Error monitoring** | NO | `lib/security/index.ts` references `SENTRY_DSN` and has a `sendToSentry()` method, but no Sentry SDK is installed. No `sentry.client.config.ts`, no `@sentry/nextjs` in dependencies. | **Server errors go to console.error only.** No alerting, no stack traces in production, no error grouping. |
| 10 | **Error boundaries (client)** | PARTIAL | Multiple `ErrorBoundary` components exist. Accept `onError` callback. No integration with any external service. | Catch rendering errors but do not report them anywhere persistent. |
| 11 | **Security event logging** | PARTIAL | `SecurityMonitor` class in `lib/security/index.ts` tracks failed logins, suspicious activity, rate limit violations. In-memory array capped at 1000 events. | **In-memory only.** Lost on restart. No persistent storage, no alerting. |
| 12 | **Health endpoint** | MINIMAL | `/api/v2/health` returns `{ status: "healthy" }` unconditionally. | **Checks nothing.** No DB connectivity test, no dependency health, no degraded states. Always returns healthy even if the database is down. |
| 13 | **Session tracking (constitutional)** | STUBBED | `ConstitutionalSessionTracker` has full API surface but all DB writes are commented out. In-memory `Map` only. | **Completely non-functional in production.** All session data lost on deploy. |
| 14 | **Founder dashboard** | YES (code) | `lib/analytics/founder-dashboard.ts` computes revenue, pipeline, pressure, call funnel, action queue. | Well-designed but requires manual data input -- not wired to auto-collect from DB. |
| 15 | **Uptime monitoring** | NO | No evidence of external uptime monitoring (UptimeRobot, Checkly, Vercel checks, etc.). | No alerting if the site goes down. |
| 16 | **Structured logging** | NO | Server-side code uses raw `console.error`/`console.log`. No structured JSON logging, no log aggregation service. | Cannot search/filter/alert on production logs. |

---

## The Four Questions

### 1. "Who started a diagnostic?"

**Answer: YES** -- `trackDiagnosticStart(diagnosticRoute)` fires a `diagnostic_start` event persisted to `DecisionJourneyEvent` with sessionId and optional userId. `trackFunnelEntry(entryRoute)` also fires via GA4. The `getEvidenceCompletionRate()` function counts unique sessions that hit `diagnostic_start`.

### 2. "Where did they drop off?"

**Answer: YES** -- Three complementary systems:
- `getDropOffMap()` computes drop-off count and rate at 10 key funnel stages from DB
- `trackDropoff(stage)` fires on page unload with time_spent_ms (if >5s)
- `trackDiagnosticAbandon(stageIndex)` captures exact stage index of abandonment
- `getFunnelProgression()` returns session counts at each of 9 funnel stages
- Hesitation events (DOUBT, CONFUSION, PRICE_RESISTANCE) provide qualitative "why" data

### 3. "Who converted to paid?"

**Answer: YES** -- `trackExecPurchase(price)`, `trackAssetPurchase(bundleId, price)`, and `trackStrategyCompleted()` all persist. `getFlagshipConversionRate()` calculates gate-view-to-purchase ratio. `getRevenueByPath()` breaks down revenue by product path. `getBuyerPathEfficiency()` shows average steps and time to conversion.

### 4. "What went wrong?"

**Answer: NO** -- This is the critical gap. There is:
- No Sentry or equivalent error monitoring service
- No structured server-side logging
- No alerting on errors or anomalies
- No way to correlate a user's journey with server errors they encountered
- Security events are in-memory only
- Health endpoint is a dummy that never fails
- No way to know if the database, Stripe, or any dependency is degraded

---

## Gap Severity Assessment

| Gap | Severity | Impact | Remediation Effort |
|-----|----------|--------|-------------------|
| No error monitoring (Sentry) | **CRITICAL** | Cannot diagnose production failures. Users hit errors silently. | 2-4 hours: `npm i @sentry/nextjs`, create config files, set DSN |
| Health endpoint is a dummy | **HIGH** | Cannot detect degraded state. Uptime monitors get false positives. | 1-2 hours: Add DB ping, check env vars, return degraded status |
| Session tracker DB is stubbed | **HIGH** | Constitutional session data (the richest behavioural data) is lost every deploy | 2-3 hours: Add Prisma model, uncomment writes |
| Analytics event API is no-op | **MEDIUM** | AnalyticsContext events vanish in production (journey events still work via separate pipeline) | 1 hour: Forward to journey pipeline or remove dead code |
| No structured logging | **MEDIUM** | Cannot search production logs, no audit trail for API errors | 2-3 hours: Add pino/winston, configure Vercel log drain |
| No uptime monitoring | **MEDIUM** | No alerting when site is down | 30 min: Add UptimeRobot or Checkly free tier |
| Security events in-memory only | **MEDIUM** | Security incidents are invisible after restart | 1-2 hours: Persist to DB or external service |
| Conviction state client-only | **LOW** | Cross-device journeys cannot be tracked | Future: Link to server-side user identity |

---

## "If a user drops off mid-diagnostic, can the team find out where and why?"

**WHERE: Yes.** The `DecisionJourneyEvent` table records every stage transition with timestamps. `getDropOffMap()` shows exactly which stage lost users. `trackDiagnosticAbandon(stageIndex)` captures the precise abandonment point. The funnel progression query shows the cascade from `diagnostic_start` through to `strategy_allowed`.

**WHY: Partially.** The hesitation detection system (DOUBT, CONFUSION, OVERLOAD, PRICE_RESISTANCE) provides behavioural signals -- was the user scrolling back and forth (confusion)? Did they hover on a CTA for 3+ seconds then leave (price resistance)? Did they go idle for 4+ seconds (doubt)? These are persisted as journey events and queryable. However, if the drop-off was caused by a *server error, slow response, or broken UI*, the team has no way to know -- there is no error monitoring, no performance tracking, and no way to correlate a journey session with server-side failures.

**Bottom line:** The analytics instrumentation is genuinely strong -- the conviction state machine, hesitation detection, and decision-journey pipeline are well above market standard. But the system is blind to its own failures. It can tell you the user hesitated and left; it cannot tell you the API returned a 500 error that caused them to leave.
