# Entry Point Route Matrix

**Date:** 2026-05-07
**Scope:** All public entry routes into Decision Infrastructure by Abraham of London
**Standard:** Each entry point must be route-valid, data-backed, progression-safe, and capable of supporting the product promise.

---

## Route Matrix

| Route | Page/Component File | Primary User Type | Data Source | Engine | Result Surface | Progression Destination | Refusal/Restriction | Memory/Outcome | Status |
|-------|-------------------|------------------|-------------|--------|---------------|------------------------|--------------------|--------------|----|
| `/` | `pages/index.tsx` + `components/homepage/CategoryFrontDoor.tsx` | All visitors | Static (demo) + DB (proof blocks) | None (deterministic demo) | Homepage sections | `/diagnostics/fast`, `/diagnostics/enterprise-assessment`, `/diagnostics/executive-reporting` | Demo RESTRICT directive shown | Proof blocks from DB if available | **STRONG** |
| `/diagnostics` | `pages/diagnostics/index.tsx` | All visitors | Static (card definitions) | None | Hub page | 5 starting signals to diagnostic routes | Route strip shows STRATEGY/DIAGNOSTIC/WATCH/REJECT | None on hub | **STRONG** |
| `/diagnostics/fast` | `pages/diagnostics/fast.tsx` | Individual leaders | API: `POST /api/diagnostics/score` | C3 fidelity, synthesis engine, forecast | Inline result with anchor narrative | Purpose Alignment, Executive Reporting | Commitment gate, vague-input flags, unresolved classification | 14-day re-evaluation, sessionStorage persistence, DB write | **STRONG** |
| `/diagnostics/purpose-alignment` | `pages/diagnostics/purpose-alignment.tsx` + `lib/alignment/PurposeAlignmentAssessment.tsx` | Individual leaders | API: `POST /api/purpose-alignment/assessments` | Dual-axis scoring, domain profiling, coherence banding | Inline result with pattern classification | Constitutional Diagnostic | Coherence band classification (SOVEREIGN/ALIGNED/DRIFTING/FRACTURED) | DB persistence, 14-day reassessment, email capture | **STRONG** |
| `/diagnostics/constitutional-diagnostic` | `pages/diagnostics/constitutional-diagnostic.tsx` + `components/diagnostics/ConstitutionalDiagnostic.tsx` | Operators, executives | API: `POST /api/diagnostics/constitutional-intake/report` | Constitutional orchestration engine, V2.2 sovereign routing kernel | Inline result with route, posture, readiness | Team Assessment, Executive Reporting | STRATEGY/DIAGNOSTIC/REJECT routing with confidence score | DB persistence, state token, spine handoff | **STRONG** |
| `/diagnostics/team-assessment` | `pages/diagnostics/team-assessment.tsx` | Team leaders | API: `POST /api/diagnostics/submit` + `/api/diagnostics/challenge` | Local fragility calculation, Bessel-corrected gap analysis | Inline result with perception gaps | Enterprise Assessment | Gap severity escalation triggers | DB persistence, sessionStorage | **STRONG** |
| `/diagnostics/enterprise-assessment` | `pages/diagnostics/enterprise-assessment.tsx` | Institutional leaders | API: `POST /api/diagnostics/submit` + `/api/diagnostics/challenge` | Domain scoring, risk formula, decision signal evaluation | Inline result with pressure map | Executive Reporting | WATCH classification, escalation routing | DB persistence, CRM forward (HubSpot), sessionStorage | **STRONG** |
| `/diagnostics/executive-reporting` | `pages/diagnostics/executive-reporting.tsx` + `components/diagnostics/ExecutiveReportingPaywall.tsx` | Operators with evidence | Aggregates prior assessments from sessionStorage | None (synthesis/aggregation only) | Paywall entry with evidence preview | Strategy Room (conditional) | Server-side `enforceExecutiveReportingAccess()`, micro-commitment checkpoint | DB metadata, checkout enforcement | **STRONG** |
| `/diagnostics/executive-reporting/run` | `pages/diagnostics/executive-reporting/run.tsx` | Paying customers | Accumulated evidence + DB session | Report generation engine | Full executive report | Strategy Room | Access enforcement, evidence validation | Full report persisted | **STRONG** |
| `/strategy-room` | `pages/strategy-room/index.tsx` | Qualified executives | SSR: entitlement check, DB session | Qualification evaluation, terrain assessment, intervention suggestion | Execution chamber | Return Brief | Entitlement gate (server), decision authority gate (client) | DB session, execution records | **PARTIAL** |
| `/consulting/strategy-room` | Redirect wrapper | — | — | — | Redirects to `/strategy-room` | — | — | — | **STRONG** (redirect only) |
| `/briefing/return/[sessionId]` | `app/briefing/return/[sessionId]/page.tsx` | Return users | API: `GET /api/strategy-room/briefing/return/[sessionId]` | `generateReturnBrief()` with trajectory triggers, outcome evaluation | Dynamic brief with trajectory, contradiction, delta | Retainer governance (if persistent pattern) | Access token validation, security audit logging | Outcome verification at 14/30 days, execution state tracking | **STRONG** |
| `/evidence/[slug]` | `pages/evidence/[slug].tsx` | All visitors | Static: hardcoded `ASSETS` object | None | Static dossier with 13+ sections per case | Homepage, diagnostics | None | None | **PARTIAL** |
| `/evidence` | `pages/evidence/index.tsx` | All visitors | Static | None | Evidence listing | Individual case pages | None | None | **PARTIAL** |

---

## Strongest entry point today

**Fast Diagnostic (`/diagnostics/fast`)** — Real engine, real consequence output, commitment gate, memory invitation, earned progression, under 2 minutes. Complete product microcosm.

## Weakest entry point today

**Strategy Room (`/strategy-room`)** — Now has server-side admission module (`lib/strategy-room/admission.ts`) that validates prior diagnostic evidence, decision specificity, authority signal, pre-commitment, and authority enforcement before admission. Status upgraded from WEAK to PARTIAL pending integration into the Strategy Room execution API route.

**Update 2026-05-07 (Final):** All admission modules are now **route-enforced**:

- `app/api/strategy-room/execution/route.ts` calls `evaluateStrategyRoomAdmission()` — blocks session creation if RESTRICTED
- `lib/strategy-room/enrol-core.ts` calls `evaluateStrategyRoomAdmission()` — attaches admission to inquiry metadata
- `pages/api/billing/checkout.ts` calls `evaluateERAdmission()` for ER products — blocks Stripe session if RESTRICTED
- `lib/product/living-case-store.ts` provides `deriveLivingCase()` — server-authoritative case view from Prisma models
- `lib/product/signal-continuity.ts` provides `deriveSignalContinuity()` — classifies signals as NEW/REPEATED/WORSENING/IMPROVING/RESOLVED/VERIFIED_PATTERN
- `components/proof/PublicProofBlocks.tsx` now includes `data-proof-status` and `data-evidence-classification` attributes with visible fallback label

No serious room without server-side admission. No paid surface without evidence validation.
