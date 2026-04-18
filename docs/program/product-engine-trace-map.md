# Product Engine Trace Map

Purpose: trace actual live flows from input capture to processing, output, persistence, and escalation.

## 1. Constitutional Diagnostic

`/diagnostics/constitutional-diagnostic`
→ `components/assessments/ConstitutionalDiagnosticSuite.tsx`
→ local answer state: `{ [questionId]: { resonance, certainty } }`
→ local derivation in `buildDecision()`
→ `lib/constitution/rules.ts::evaluateConstitutionalRoute()`
→ local verdict surface inside `ConstitutionalDiagnosticSuite`
→ local next-step href

Actual decisions:
- `STRATEGY` → `/strategy-room`
- `DIAGNOSTIC` → `/diagnostics/executive-reporting`
- `REJECT` → `/diagnostics`

What is and is not happening:
- Stage-complete analytics fire when verdict becomes visible.
- No call to `/api/diagnostics/submit`.
- No shared diagnostic record is persisted by this page.
- Output is UI-only unless some other downstream surface captures it.

## 2. Team Assessment

Canonical page path:

`/diagnostics/team-assessment`
→ local identity form + leader/reality score maps
→ local helpers: `domainPct()`, `buildGaps()`, `deriveGapReading()`
→ fragility via `lib/alignment/fragility-logic.ts::calculateFragility()`
→ payload built with `lib/diagnostics/types.ts`
→ `lib/diagnostics/client.ts::submitDiagnostic()`
→ `/api/diagnostics/submit`
→ `lib/server/diagnostics/store.ts::saveDiagnosticRecord()`
→ response stored in page state
→ local handoff data written to `sessionStorage["team-assessment-result"]`
→ client progression signal fixed to `/diagnostics/enterprise-assessment`

Important split:
- Structural interpretation is local to the page.
- Persistence is generic through `/api/diagnostics/submit`.
- The API does not compute the perception-gap reading; it stores the submitted summary/metadata.

Local routing truth:
- The page computes `reading.route` locally.
- The page always tracks completion as a diagnostic path to enterprise.
- `sessionStorage` carries richer local state than the API response.

Legacy/parallel team path:

`components/assessments/TeamAssessmentSuite.tsx`
→ slider/grid input
→ `/api/assessments/team/run`
→ simple `varianceIndex`, `trustGap`, `avgFriction`, `nextLayer`
→ local result card

What differs:
- This path bypasses `/api/diagnostics/submit`.
- No shared diagnostics store write.
- It is an alternate engine, not the canonical ladder page.

## 3. Enterprise Assessment

Canonical page path:

`/diagnostics/enterprise-assessment`
→ local identity + 4-block Likert answers
→ local helpers: `sectionPct()`, `deriveReading()`
→ local band/severity via `lib/diagnostics/client.ts`
→ payload built with diagnostic contracts
→ `submitDiagnostic()`
→ `/api/diagnostics/submit`
→ `lib/server/diagnostics/store.ts::saveDiagnosticRecord()`
→ page writes `sessionStorage["enterprise-assessment-result"]`
→ local route decision chooses:
  - `/strategy-room`
  - or `/diagnostics/executive-reporting`

Important split:
- Enterprise reading and route selection are local to the page.
- The shared diagnostics submit API mainly persists and returns a generic next step by `kind`.
- The page’s stored session handoff can be more specific than the API response.

Legacy/parallel enterprise path:

`components/assessments/EnterpriseAssessmentSuite.tsx`
→ slider/domain input
→ `/api/assessments/enterprise/run`
→ lightweight `enterprisePosture`, `heatDomains`, `nextLayer`
→ local result UI

What differs:
- No shared diagnostic record persistence.
- Separate simplified scoring path.

## 4. Executive Reporting

Landing page:

`/diagnostics/executive-reporting`
→ orientation only
→ links onward

Real engine:

`/diagnostics/executive-reporting/run`
→ structured intake form
→ `buildPayload()`
→ `POST /api/executive-reporting/run`
→ `app/api/executive-reporting/run/route.ts`
→ `resolveLadderContext()` for prior constitutional/team/enterprise/strategy context
→ `assembleConstitutionalGuidance()` for constitution + governed guidance + matched assets
→ `buildCanonicalReportContract()`
→ `buildExecutiveReportViewModel()`
→ result surface in `run.tsx`
→ `sessionStorage["executive-report-result"]`
→ strategy-room handoff

Outputs produced today:
- `runKey`
- `route`
- canonical report envelope
- UI view model
- recommendation list / matched assets
- telemetry / exposure / constitutional posture summaries

What is and is not happening:
- This is the deepest implemented computed output surface in the ladder.
- The result is computed server-side.
- The page always tracks stage complete toward strategy-room, regardless of route.

## 5. Strategy Room Intake and Verdict

Current canonical page flow:

`/strategy-room`
→ form spec from `lib/decision/system-constitution.ts::STRATEGY_ROOM_FORM_SPEC`
→ local validation in `validateForm()`
→ `POST /api/strategy-room/session/init`
→ `app/api/strategy-room/session/init/route.ts`
→ `assembleConstitutionalGuidance()`
→ `buildCanonicalReportContract()`
→ `normalizeCanonicalSectionsSnapshot()`
→ persisted `strategyRoomSession` row
→ session key returned
→ page then `POST /api/decision/guidance`
→ receives canonical sections
→ local verdict rendering via `localSummary()` + recommendations
→ client tracking:
  - `/api/strategy-room/session/impression`
  - `/api/strategy-room/session/conversion`
  - `/api/strategy-room/session/followup`

Important truth:
- The page is primarily a constitutional guidance engine and session tracker.
- It is not the same path as the enrolment API.

Separate canonical enrolment pipeline:

`POST /api/strategy-room/enrol`
→ `pages/api/strategy-room/enrol.ts`
→ `lib/strategy-room/enrol-core.ts`
→ recaptcha + vetting + consulting evaluation + archival/audit/notifications

Legacy strategy-room paths:
- `/api/strategy-room/intake` is an adapter into `enrol-core`.
- `/api/strategy-room/submit` writes raw `strategyIntake` rows directly.
- `/strategy-room/success` + `/api/strategy-room/results` read that older `strategyIntake` shape.

## 6. Diagnostic Report Generation

Shared diagnostics report path:

stored diagnostic record
→ `/api/diagnostics/report/generate`
→ auth/tier checks
→ `composeDiagnosticReport()` + `nextReportVersion()`
→ archive via `archiveDiagnosticPdf()`
→ append version in diagnostic store
→ HTML/PDF paths returned

PDF retrieval:

`/api/diagnostics/report/pdf`
→ auth/unlock checks
→ archived PDF or runtime PDF build

Legacy report shim:

`/api/diagnostics/report`
→ Netlify redirect stub only

## 7. Progression and Escalation Summary

Live progression is determined in more than one place:

- Constitutional: fully local in `ConstitutionalDiagnosticSuite.tsx`
- Team: local reading + shared submit persistence
- Enterprise: local reading + shared submit persistence
- Executive Reporting: server-computed route inside `/api/executive-reporting/run`
- Strategy Room: server-computed canonical posture via session init / decision guidance

Shared submit API truth:
- `/api/diagnostics/submit` persists and returns a coarse next-step href by `kind`
- it does not recompute the richer client-side readings from team or enterprise pages

Session handoff truth:
- `team-assessment-result`
- `enterprise-assessment-result`
- `executive-report-result`

Those sessionStorage keys carry more route-specific handoff context than the generic submit API response.
