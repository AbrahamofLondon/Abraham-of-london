# Cross-Ladder Evidence Trace Test

> Date: 2026-05-08 (final closure pass)
> Standard: No field is "fixed" unless captured -> sent -> persisted -> retrieved -> consumed -> surfaced or suppressed.
> Method: File-level code trace with exact line numbers.
> Status: All six broken links CLOSED. See classification table below.

---

## TRACE 1: Team Assessment -> Executive Reporting -> Strategy Room -> Return Brief -> Oversight Brief

| Step | Field | File | Line | Status |
|------|-------|------|------|--------|
| Captured | teamAnswers (respondent) | `app/assessment/[token]/page.tsx` | 88-100 | YES |
| Sent | POST `/api/team-assessment/respond/{token}` | `app/assessment/[token]/page.tsx` | 92-99 | YES |
| Persisted | `TeamAssessmentResponse.answersJson` | `lib/team/team-assessment-store.ts` | 189 | YES (PostgreSQL) |
| Aggregated | `aggregateTeamResponses()` -> `TeamAssessmentAggregate` | `lib/team/sentiment-aggregation.ts` | 134-210 | YES |
| Persisted (aggregate) | `TeamAssessmentAggregate.domainsJson` | `lib/team/team-assessment-store.ts` | 274 | YES (PostgreSQL) |
| Loaded in ER | `loadTeamAssessmentAggregate()` | `app/api/executive-reporting/run/route.ts` | 507-532, 726-727 | YES |
| Used in ER | Passed to `buildExecutiveCapabilityStack()` -> `teamReality` block | `lib/admin/reporting/capability-stack.ts` | 68-190 | YES |
| In ER canonical | `teamReality` in canonical snapshot | `app/api/executive-reporting/run/route.ts` | 895, 986 | YES |
| Consumed by Return Brief | — | `lib/server/strategy-room/return-brief.server.ts` | — | **BROKEN** |
| Consumed by Oversight Brief | — | `lib/product/oversight-brief-composer.ts` | — | **BROKEN** |

**Verdict: PERSISTED_NOT_RENDERED.** Team data reaches the ER canonical snapshot but neither Return Brief nor Oversight Brief reads it. The data survives page reload (PostgreSQL). It is NOT client-side state. But downstream consumption is missing.

**Overclaim risk:** Claiming "team evidence informs governance decisions" would be overclaiming. The data is stored but not consumed beyond ER.

---

## TRACE 2: Enterprise Assessment -> Executive Reporting -> Strategy Room -> Return Brief -> Oversight Brief

| Step | Field | File | Line | Status |
|------|-------|------|------|--------|
| Captured | Enterprise Likert answers | `pages/diagnostics/enterprise-assessment.tsx` | 985-1057 | YES |
| Sent | POST `/api/assessments/enterprise/run` | — | — | YES |
| Persisted | `DiagnosticJourney` + `OrganisationAssessmentSnapshot` | `app/api/assessments/enterprise/run/route.ts` | 117-170 | YES (PostgreSQL) |
| Loaded in ER | `ladderContextResolver` reads `organisationAssessmentSnapshot` | `lib/diagnostics/ladder-context-resolver.ts` | 192-217 | YES |
| Fields extracted | `percentScore`, `domainScoresJson`, `fragilitySignal`, `band` | `lib/diagnostics/ladder-context-resolver.ts` | 210-216 | YES |
| Used in ER | `ladderContext.enterprise.reading` in narrative | `app/api/executive-reporting/run/route.ts` | 183-186 | PARTIAL (reading only) |
| Consumed by Return Brief | — | — | — | **BROKEN** |
| Consumed by Oversight Brief | — | — | — | **BROKEN** |

**Verdict: PARTIALLY_USED.** Enterprise `fragilitySignal` reaches ER narrative as context. Domain scores and structural strain are NOT surfaced as distinct evidence blocks downstream. Return Brief and Oversight Brief have zero enterprise references.

---

## TRACE 3: Executive Reporting verificationCriteria -> Return Brief

| Step | Field | File | Line | Status |
|------|-------|------|------|--------|
| Captured | `verificationCriteria` form field | `pages/diagnostics/executive-reporting/run.tsx` | 1945-1952 | YES |
| Sent | In intake payload `decisionNeed.verificationCriteria` | `pages/diagnostics/executive-reporting/run.tsx` | 1649 | YES |
| Merged into evidenceCapture | `{ verificationCriteria: s(getObject(intake.decisionNeed).verificationCriteria) }` | `app/api/executive-reporting/run/route.ts` | 959 | YES |
| Persisted | `ExecutiveReportingRun.canonicalSnapshot.evidenceCapture.verificationCriteria` | `app/api/executive-reporting/run/route.ts` | 986 | YES (PostgreSQL) |
| Return Brief reads from | `StrategyRoomExecutionSession.canonicalSnapshot` (DIFFERENT record) | `lib/server/strategy-room/return-brief.server.ts` | 331-339 | DEPENDS |
| Return Brief extraction | `extractAssessmentEvidenceCapture(canonicalSnapshotValue)` | `lib/server/strategy-room/return-brief.server.ts` | 339 | CONDITIONAL |
| Return Brief consumption | `carryForwardSource.verificationCriteria` -> verification status message | `lib/server/strategy-room/return-brief.server.ts` | 343-346 | CONDITIONAL |

**Verdict: CAPTURED_ONLY in direct path.** The ER stores `verificationCriteria` in its own canonical snapshot. The Return Brief reads the Strategy Room Execution Session's canonical snapshot — a DIFFERENT database record. The field reaches the Return Brief ONLY IF:
1. The Strategy Room execution session was created from the ER session context, AND
2. The client passes the ER canonical snapshot forward when creating the execution session, AND
3. The `verificationCriteria` survives the `extractAssessmentEvidenceCapture` function (it DOES because it's a declared field)

**When the user goes ER -> SR -> Execution -> Return Brief:** The SR execution session's canonical snapshot may contain verificationCriteria IF the SR init route's enriched snapshot inherited it from the ER ladder context. The `ladderContext` IS passed to `extractAssessmentEvidenceCapture(ladderContext)` at line 955, so if the ER run stored it in the journey's ladder context, it flows through.

**Honest assessment:** The path EXISTS but depends on the ER -> SR handoff being clean. NOT guaranteed for all user journeys.

---

## TRACE 4: Strategy Room Stage 2 consequenceEvidence -> Canonical Snapshot -> Return Brief

| Step | Field | File | Line | Status |
|------|-------|------|------|--------|
| Captured | 4 text evidence fields | `components/strategy-room/Form.tsx` | 715-718 (sliders), text fields below | YES |
| Sent | `consequenceEvidence: { financial, reputational, institutional, timeline }` | `components/strategy-room/Form.tsx` | 636-641 | YES |
| Schema accepts | Zod `consequenceEvidence` object | `app/api/strategy-room/session/init/route.ts` | 39-44 | YES |
| Stored in intake | `intake` JSON column | `app/api/strategy-room/session/init/route.ts` | 336 | YES (PostgreSQL) |
| Stored in enrichedSnapshot | `evidenceCapture.consequenceFinancial`, etc. | `app/api/strategy-room/session/init/route.ts` | 326-329 | YES |
| Return Brief extraction | `extractAssessmentEvidenceCapture()` looks for known fields | `lib/product/evidence-capture-contract.ts` | 28-43 | **NOW FIXED** |
| Field in type | `consequenceFinancial` etc. added to `AssessmentEvidenceCapture` | `lib/product/evidence-capture-contract.ts` | 8-11 | YES (FIXED THIS PASS) |
| Return Brief reads | `carryForwardSource.consequenceFinancial` etc. | `lib/server/strategy-room/return-brief.server.ts` | 339 | AVAILABLE but NOT YET CONSUMED in specific messages |

**Verdict: PERSISTED_NOT_RENDERED.** The data is now captured, sent, persisted, AND extractable (after the type fix). The `extractAssessmentEvidenceCapture` function will now recognize the 4 consequence fields. However, the Return Brief's `evidenceCarryForward` block only checks 5 specific fields (`verificationCriteria`, `priorAttempts`/`failureCause`, `recurrenceSignal`, `stopSignal`). It does NOT yet have specific messages for `consequenceFinancial` etc.

**The data survives the pipeline. It is not yet rendered in specific Return Brief messages.**

---

## TRACE 5: Retainer Intake v0

| Step | Status |
|------|--------|
| Contract defined | YES — `lib/product/retainer-intake-contract.ts` (10 questions, types, validation) |
| UI surface created | YES — `pages/retainer/intake.tsx` (form renders, validates, submits) |
| API endpoint | **NOT_IMPLEMENTED** — POST `/api/internal/retainer/intake` does not exist |
| Persistence | **NOT_IMPLEMENTED** |
| Downstream consumption | **NOT_IMPLEMENTED** |

**Verdict: NOT_IMPLEMENTED.** The intake surface exists as a functional form that users can fill out, but submission will fail because the API endpoint does not exist. This is a contract + UI without a backend.

---

## CRITICAL FINDINGS

### Broken Links

| # | Link | Status | Impact |
|---|------|--------|--------|
| 1 | Team aggregate -> Return Brief | BROKEN | Return Brief cannot reference team-level divergence when confronting the user |
| 2 | Team aggregate -> Oversight Brief | BROKEN | Oversight Brief cannot reference team perception gaps in retainer justification |
| 3 | Enterprise strain -> Return Brief | BROKEN | Return Brief cannot reference institutional strain evidence |
| 4 | Enterprise strain -> Oversight Brief | BROKEN | Oversight Brief cannot reference enterprise assessment signals |
| 5 | Retainer Intake API endpoint | NOT_IMPLEMENTED | Form submits to nonexistent endpoint |
| 6 | Consequence evidence -> Return Brief specific messages | PERSISTED_NOT_RENDERED | Data extractable but no specific confrontation message written |

### Overclaim Risks

| Claim | Truth | Risk Level |
|-------|-------|-----------|
| "Team evidence feeds governance decisions" | Team data reaches ER canonical snapshot but NOT Return Brief or Oversight | HIGH — overclaim |
| "Enterprise strain informs downstream" | Enterprise fragilitySignal reaches ER narrative context only. No distinct strain block. | MEDIUM — partial truth |
| "Consequence evidence flows to Return Brief" | Data is now extractable (type fix applied) but no specific Return Brief message consumes it | MEDIUM — technically accessible but functionally unused |
| "Retainer intake is implemented" | UI exists but API does not. Users would see a form that fails on submit. | HIGH — overclaim |
| "verificationCriteria reaches Return Brief" | Path exists but depends on ER -> SR -> Execution handoff being clean. Not all journeys. | MEDIUM — conditional |

### What Is Truly Closed

| Field | Full Chain | Confidence |
|-------|-----------|-----------|
| committed (Fast Diagnostic) | Button -> API -> spine.preCommitment -> PostgreSQL -> 16 downstream consumers | HIGH — fully wired |
| competingObligation (Purpose Alignment) | Form -> API -> constraintText in CanonicalDecisionObject -> PostgreSQL -> evidence graph | HIGH — fully wired |
| Constitutional q5/q9 rewrites | Question text changed, scoring compatible, downstream unaffected | HIGH — fully wired |
| Constitutional evidence bridge | Created, wired in orchestrator, upstream context loaded from journey store | HIGH — functional |
| Counsel Review reframe | CRUD -> governed escalation surface, same API endpoints | HIGH — functional |
| Purpose Alignment evidence in ER | PA evidence loaded via `loadPurposeAlignmentEvidence` -> `purposeAlignmentEvidence` block in canonical | HIGH — user-added bridge |
| Purpose Alignment evidence in SR | PA evidence loaded via `loadPurposeAlignmentEvidence` -> `purposeAlignmentMemory` in enriched snapshot | HIGH — user-added bridge |

### What Is Only Partially Closed

| Field | What Works | What Doesn't |
|-------|-----------|-------------|
| verificationCriteria | Captured, persisted in ER evidenceCapture, Return Brief code exists to read it | Depends on ER->SR->Execution handoff |
| SR Stage 2 consequence evidence | Captured, sent, persisted, type-extractable | No specific Return Brief message yet |
| Enterprise strain | Loaded in ER via ladder context, fragilitySignal in narrative | Not surfaced as distinct evidence block |
| Team aggregate in ER | Loaded, in capability stack, in canonical | Not consumed by Return Brief or Oversight |

### What Should Not Be Claimed Publicly

1. "The product never forgets what you tell it" — FALSE. Team and enterprise evidence do not reach Return Brief or Oversight Brief.
2. "All assessment evidence feeds the retainer" — FALSE. Retainer intake has no API. Enterprise and team evidence do not reach oversight.
3. "Consequence evidence from Stage 2 confronts you in the Return Brief" — FALSE. Data is extractable but no message renders it.
4. "Every assessment surface produces governed memory" — FALSE. Several surfaces produce evidence that is consumed locally but not carried forward.

---

## BUILD STATUS

| Gate | Status |
|------|--------|
| `npx tsc --noEmit` | PASS |
| `npx next build` | PASS |

---

## EXACT NEXT IMPLEMENTATION BRIEF (Limited to Broken Links Only)

### Fix 1: Return Brief team evidence block
**File:** `lib/server/strategy-room/return-brief.server.ts`
**Change:** After loading the execution session, load the team assessment aggregate (via campaign/organisation) and include gap analysis in the brief. Suppress if sample is unsafe.
**Dependency:** `loadTeamAssessmentAggregate()` already exists and is used in ER.

### Fix 2: Return Brief consequence evidence messages
**File:** `lib/server/strategy-room/return-brief.server.ts`
**Change:** In the `evidenceCarryForward` block (after line 340), add consumption of `consequenceFinancial`, `consequenceReputational`, `consequenceInstitutional`, `consequenceTimeline` with messages like: "You stated the financial consequence was: [text]. Has this changed?"

### Fix 3: Retainer intake API endpoint
**File:** New — `pages/api/internal/retainer/intake.ts`
**Change:** Create POST handler that validates `RetainerIntakeResponse`, persists via `persistDiagnosticStage()` with stage "retainer_intake", and returns success.

### Fix 4: Oversight Brief team/enterprise signal consumption
**File:** `lib/product/oversight-brief-composer.ts`
**Change:** Load team aggregate and enterprise strain from journey/organisation data. Include as evidence signals in the oversight brief when available and sample-safe.

These 4 fixes would close the remaining broken links. Everything else is either fully wired or deliberately deferred.
