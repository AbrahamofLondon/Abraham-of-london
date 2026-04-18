# Product Engine File Inventory

Purpose: factual file-level inventory of the current product engine surfaces so Claude can audit implementation instead of names.

| Layer | File | Role | Canonical/Legacy | Notes |
| --- | --- | --- | --- | --- |
| Input | `pages/diagnostics/constitutional-diagnostic.tsx` | Canonical constitutional entry page | Canonical | Owns page shell, analytics start/dropoff, mounts constitutional suite |
| Input | `components/assessments/ConstitutionalDiagnosticSuite.tsx` | Constitutional question instrument and local verdict engine | Canonical | Captures answers in local state and computes route locally via `evaluateConstitutionalRoute`; does not persist through `/api/diagnostics/submit` |
| Processing | `lib/constitution/rules.ts` | Constitutional routing kernel | Canonical | Real STRATEGY / DIAGNOSTIC / REJECT decision logic, thresholds, disqualifiers, confidence |
| Input | `pages/diagnostics/team-assessment.tsx` | Canonical team ladder page | Canonical | Owns identity, leader/reality answers, local perception-gap reading, and diagnostic submit |
| Processing | `lib/alignment/fragility-logic.ts` | Team volatility / fragility calculation | Canonical | Bessel-corrected standard deviation used by canonical team page |
| Processing | `lib/diagnostics/client.ts` | Shared client helpers for page-based ladder | Canonical | Scoring helpers and shared `submitDiagnostic()` client for team/enterprise pages |
| Processing | `lib/diagnostics/types.ts` | Shared diagnostic payload/response contract | Canonical | Defines request/response, stored record shape, next-route types |
| Routing | `pages/api/diagnostics/submit.ts` | Shared diagnostic persistence endpoint | Canonical | Validates, rate-limits, resolves actor, CRM forwards, persists, returns generic next-step href by `kind` |
| Persistence | `lib/server/diagnostics/store.ts` | Diagnostic record store | Canonical | File-backed SSOT with optional Prisma mirror tolerance; stores answers, summary, metadata, report versions |
| Input | `pages/diagnostics/team-alignment.tsx` | Redirect only | Legacy | Permanent redirect to `/diagnostics/team-assessment` |
| Input | `components/assessments/TeamAssessmentSuite.tsx` | Alternate team input surface | Legacy / parallel | Uses separate `/api/assessments/team/run`; stores a result in sessionStorage but bypasses shared diagnostic submit/store |
| Processing | `app/api/assessments/team/run/route.ts` | Lightweight team scoring API | Legacy / parallel | Computes `varianceIndex`, `trustGap`, `avgFriction`, `nextLayer`; no shared diagnostics persistence |
| Input | `pages/diagnostics/enterprise-assessment.tsx` | Canonical enterprise ladder page | Canonical | Owns identity, 12-question instrument, local enterprise reading, and diagnostic submit |
| Input | `components/assessments/EnterpriseAssessmentSuite.tsx` | Alternate enterprise input surface | Legacy / parallel | Slider-based experience with separate API, not the canonical page path |
| Processing | `app/api/assessments/enterprise/run/route.ts` | Lightweight enterprise scoring API | Legacy / parallel | Computes disorder/readout and `nextLayer`; no shared diagnostics persistence |
| Input | `pages/diagnostics/enterprise.tsx` | Redirect only | Legacy | Permanent redirect to `/diagnostics/enterprise-assessment` |
| Input | `pages/diagnostics/executive-reporting.tsx` | Executive reporting landing page | Thin wrapper | Marketing / orientation surface only; does not generate report output |
| Input | `pages/diagnostics/executive-reporting/run.tsx` | Executive reporting intake + result UI | Canonical | Captures structured intake, calls `/api/executive-reporting/run`, stores `executive-report-result` in sessionStorage |
| Processing | `app/api/executive-reporting/run/route.ts` | Executive reporting engine | Canonical | Builds run key, resolves ladder context, assembles constitution/guidance, builds canonical contract and view model |
| Processing | `lib/diagnostics/ladder-context-resolver.ts` | Ladder context hydrator | Canonical | Pulls prior constitutional/team/enterprise/strategy artifacts from Prisma by email/org/campaign |
| Processing | `lib/decision/constitutional-guidance-assembler.ts` | Asset + recommendation assembly layer | Canonical | Derives constitution from intake, loads catalog buckets, scores assets, applies governance |
| Processing | `lib/decision/system-constitution.ts` | Strategy-room constitutional intake schema and derivation logic | Canonical | Defines strategy-room input spec and derives constitutional assessment from intake |
| Processing | `lib/admin/reporting/canonical-report-contract.ts` | Canonical report envelope builder | Canonical | Normalizes constitution + guidance + report telemetry into canonical sections |
| Processing | `lib/admin/reporting/executive-report-view-model.ts` | Executive-report presentation mapper | Canonical | Converts canonical contract into UI-friendly header/summary/findings/recommendations |
| Processing | `lib/decision/canonical-sections.ts` | Canonical sections envelope contract/coercion | Canonical | Type/shape normalizer used by strategy-room and reporting surfaces |
| Output | `app/admin/reporting/executive/[id]/page.tsx` | Admin executive report view | Canonical output surface | Admin-facing report rendering surface for executive reporting artifacts |
| Output | `pages/api/diagnostics/report/generate.ts` | Diagnostic report issuance endpoint | Canonical output surface | Auth-gated report composition + archive registration for stored diagnostics |
| Output | `pages/api/diagnostics/report/pdf.ts` | Diagnostic report PDF delivery | Canonical output surface | Unlock checks, archived PDF lookup, fallback PDF build |
| Output | `pages/api/diagnostics/report.ts` | Netlify function redirect stub | Legacy wrapper | Redirect shim to `/.netlify/functions/diagnostic-report` |
| Input | `pages/strategy-room/index.tsx` | Canonical strategy-room page | Canonical | Captures governed intake, initializes session, fetches canonical guidance, renders verdict |
| Processing | `app/api/strategy-room/session/init/route.ts` | Strategy-room session initializer | Canonical | Creates `strategyRoomSession`, assembles constitution/guidance, stores canonical snapshot |
| Processing | `app/api/decision/guidance/route.ts` | Canonical guidance endpoint | Canonical | Re-runs constitutional guidance assembly and returns canonical sections |
| Processing | `lib/strategy-room/canonical-snapshot.ts` | Canonical snapshot normalizer | Canonical | Reduces canonical sections/envelope to snapshot persisted on strategy-room session records |
| Processing | `lib/strategy-room/client-trackers.ts` | Strategy-room client tracking bridge | Canonical | Posts conversion/followup events with canonical snapshot |
| Output | `app/api/strategy-room/session/impression/route.ts` | Recommendation impression capture | Canonical support | Persists recommendation impressions to strategy-room session tables |
| Output | `app/api/strategy-room/session/conversion/route.ts` | Conversion capture | Canonical support | Persists user conversion actions with canonical snapshot |
| Output | `app/api/strategy-room/session/followup/route.ts` | Follow-up capture | Canonical support | Persists post-verdict route/follow-up outcomes |
| Input | `pages/api/strategy-room/enrol.ts` | Canonical enrolment API | Canonical but not main page path | Normalizes canonical input and delegates to `enrol-core`; not used by the current `/strategy-room` page flow |
| Processing | `lib/strategy-room/enrol-core.ts` | Strategy-room enrolment pipeline | Canonical but separate lane | Recaptcha, vetting, consulting evaluation, archival, Discord/audit path |
| Input | `pages/api/strategy-room/intake.ts` | Legacy adapter to enrol-core | Legacy adapter | Normalizes to enrol-core, preserves older intake clients |
| Input | `pages/api/strategy-room/submit.ts` | Legacy raw intake writer | Legacy | Writes `strategyIntake` directly; separate from canonical guidance/session flow |
| Processing | `lib/strategy-room/session-service.ts` | Minimal session helper | Thin wrapper | Generates a local session object; not the main persisted strategy-room session path |
| Output | `app/api/strategy-room/results/route.ts` | Legacy strategy-intake record reader | Legacy output | Reads raw `strategyIntake` row by id |
| Output | `app/strategy-room/success/page.tsx` | Legacy strategy success page | Legacy output | Fetches `/api/strategy-room/results`; expects old `strategyIntake` record shape |
| Routing | `pages/consulting/strategy-room.tsx` | Redirect only | Legacy | Permanent redirect to `/strategy-room` |
| Routing | `pages/diagnostics/index.tsx` | Ladder directory page | Canonical navigation | Exposes ladder rungs; not a scoring engine |
| Routing | `pages/diagnostic.tsx` | CSS/env diagnostic tool | Dead-weight for product engine | Not related to business diagnostics ladder |
