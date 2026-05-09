# Launch Instrumentation Implementation Report

**Date:** 2026-05-09
**Verdict:** INSTRUMENTATION_READY_BROWSER_ACCEPTANCE_PENDING

---

## What Was Implemented

### Event System
- `lib/analytics/launch-events.ts` — typed event definitions (19 event names), blocked field list, payload validation
- `lib/analytics/client-launch-events.ts` — browser-safe best-effort tracker (never throws, never blocks UX)
- `pages/api/analytics/launch-event.ts` — POST endpoint with Zod validation, blocked field rejection, identity resolution, email hashing, diagnosticRecord persistence

### Events Wired

| Surface | File | Event | Trigger |
|---------|------|-------|---------|
| Homepage | `components/homepage/CategoryFrontDoor.tsx` | `homepage_cta_clicked` | Primary "Test a decision" CTA click |
| Fast Diagnostic | `pages/diagnostics/fast.tsx` | `fast_completed` | After successful result render |
| Decision Centre | `pages/decision-centre.tsx` | `decision_centre_opened` | After successful data load |
| ER Gate | `pages/diagnostics/executive-reporting.tsx` | `executive_reporting_gate_viewed` | On page load |
| Strategy Room | `pages/strategy-room/index.tsx` | `strategy_room_entered` | On entry/page load |
| Counsel Room | `pages/counsel/index.tsx` | `counsel_room_viewed` | On component mount (with admission state) |
| Counsel Intake | `pages/counsel/intake.tsx` | `counsel_intake_submitted` | After successful API submission |

### Events NOT Wired (and why)

| Event | Reason |
|-------|--------|
| `fast_started` | Already tracked via existing `track("fast_diagnostic_started")` — adding launch event would duplicate |
| `checkpoint_created` / `checkpoint_responded` | Created server-side in checkpoint service — would require server-side event emission, not client tracking |
| `earned_step_shown` / `earned_step_clicked` | `ProductRecommendationCard` renders conditionally — requires prop drilling; deferred to post-launch |
| `return_brief_opened` / `return_brief_response_submitted` | App Router page (`app/briefing/return/`) — requires different import pattern; deferred to post-launch |
| `purpose_alignment_started` / `purpose_alignment_completed` | PurposeAlignmentAssessment component needs investigation for mount/complete hooks; deferred |
| `executive_reporting_started` | Fires inside ER run page after checkout — complex state machine; deferred |
| `strategy_room_decision_recorded` | Fires inside strategy room session after mutation — deferred |
| `counsel_intake_started` | Would fire on intake page mount but page is already gated; low priority |

### Dashboard
- `pages/admin/launch-dashboard.tsx` — admin-gated, shows funnel progression and surface activity
- `pages/api/admin/launch-events.ts` — admin-gated API returning event counts by time window (7d/30d/all)

### Code-Level Defects Found and Fixed
- `pages/diagnostics/executive-reporting/run.tsx` — 5 TypeScript errors from Codex parallel build:
  - Missing `AssessmentEvidenceCapture` and `extractAssessmentEvidenceCapture` imports → added
  - `viewModel`, `canonical`, `route`, `entitlements` missing from `ExecutiveReportingResult` type → added as optional fields
  - `generatedAt` null vs undefined type mismatch → fixed with `?? undefined`

---

## Build Gates

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | **PASS** — 0 errors |
| `npx next build` | **PENDING** (running) |
| `scripts/public-copy-guard.mjs` | **PASS** — 1,020 files, 0 violations |
| `scripts/evidence-posture-guard.mjs` | **PASS** — 2,606 files, 0 violations |
| `scripts/earned-progression-guard.mjs` | **PASS** — 1,020 files, 0 violations |

---

## What Was NOT Done

1. **Browser verification** — not performed. The agent cannot run a browser. Manual acceptance checklist prepared at `docs/product/manual-browser-acceptance-checklist.md`.
2. **Return Brief instrumentation** — App Router page requires different import pattern.
3. **Checkpoint created/responded** — server-side events, not client-trackable without API-level emission.
4. **Earned step shown/clicked** — requires prop drilling into ProductRecommendationCard.
5. **Rate limiting on launch-event endpoint** — not added; existing rate-limit helpers were not readily available for this route pattern. Documented as non-blocking.

---

## Files Created

| File | Purpose |
|------|---------|
| `lib/analytics/launch-events.ts` | Event type definitions + payload validation |
| `lib/analytics/client-launch-events.ts` | Browser-safe event tracker |
| `pages/api/analytics/launch-event.ts` | Event persistence endpoint |
| `pages/admin/launch-dashboard.tsx` | Internal drop-off dashboard |
| `pages/api/admin/launch-events.ts` | Dashboard data endpoint |
| `docs/product/manual-browser-acceptance-checklist.md` | 8-journey browser verification checklist |

## Files Modified

| File | Change |
|------|--------|
| `components/homepage/CategoryFrontDoor.tsx` | Added `trackLaunch` import + homepage CTA tracking |
| `pages/diagnostics/fast.tsx` | Added `trackLaunch` import + fast_completed event |
| `pages/decision-centre.tsx` | Added `trackLaunch` import + decision_centre_opened event |
| `pages/diagnostics/executive-reporting.tsx` | Added `trackLaunch` import + ER gate viewed event |
| `pages/strategy-room/index.tsx` | Added `trackLaunch` import + strategy_room_entered event |
| `pages/counsel/index.tsx` | Added `trackLaunch` import + counsel_room_viewed event |
| `pages/counsel/intake.tsx` | Added `trackLaunch` import + counsel_intake_submitted event |
| `pages/diagnostics/executive-reporting/run.tsx` | Fixed 5 TypeScript errors from Codex parallel build |

---

## Verdict

**INSTRUMENTATION_READY_BROWSER_ACCEPTANCE_PENDING**

- Instrumentation system is implemented and compiling
- 7 key surface events are wired
- Admin dashboard is created and admin-gated
- Manual browser checklist is prepared
- Browser verification has NOT been performed
- The product is NOT marked as browser-accepted until a human walks the 8 journeys
