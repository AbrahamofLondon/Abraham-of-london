# Evidence Consumption Closure — Hostile Audit

> Date: 2026-05-08
> Standard: No claim accepted unless all 8 steps verified: captured -> submitted -> persisted -> loaded -> composed -> rendered -> source-labelled -> safely worded.
> Method: Direct code verification with exact file paths and line numbers.

---

## SIX-LINK TRACE VERDICT TABLE

| Link | Captured | Submitted | Persisted | Loaded (server) | Composed/Transformed | UI Rendered | Source Label | Safe Wording | Suppression | **Final Verdict** |
|------|:--------:|:---------:|:---------:|:---------------:|:--------------------:|:-----------:|:------------:|:------------:|:-----------:|:-----------------:|
| 1. Team -> Return Brief | YES | YES | YES (TeamAssessmentAggregate) | YES (return-brief.server.ts ~line 364) | YES (gap analysis extracted) | **NO** (page.tsx has no teamEvidence render) | N/A | N/A | respondentCount >= 1 checked | **PARTIALLY_CLOSED** |
| 2. Team -> Oversight Brief | YES | YES | YES | **NO** (composer line 141 does NOT pass teamAggregate) | **NO** | **NO** | N/A | N/A | N/A | **ACCEPTS_INPUT_BUT_NOT_CONSUMED** |
| 3. Enterprise -> Return Brief | YES | YES | YES (OrganisationAssessmentSnapshot) | YES (return-brief.server.ts ~line 403) | YES (fragility extracted) | **NO** (page.tsx has no enterpriseEvidence render) | N/A | N/A | null-safe | **PARTIALLY_CLOSED** |
| 4. Enterprise -> Oversight Brief | YES | YES | YES | **NO** (composer line 141 does NOT pass enterpriseStrain) | **NO** | **NO** | N/A | N/A | N/A | **ACCEPTS_INPUT_BUT_NOT_CONSUMED** |
| 5. Consequence -> Return Brief | YES | YES | YES (enrichedSnapshot.evidenceCapture) | YES (extractAssessmentEvidenceCapture) | YES (consequence messages built) | **NO** (page.tsx has no consequenceEvidence render) | N/A | N/A | null-safe | **PARTIALLY_CLOSED** |
| 6. Retainer Intake API | YES (form) | YES (POST /api/retainer/intake) | YES (diagnosticRecord) | **NO** (no downstream loader) | **NO** | **NO** | N/A | N/A | N/A | **PERSISTED_NOT_RENDERED** |

---

## DETAILED FINDINGS

### Claim 1: Team aggregate -> Return Brief — PARTIALLY_CLOSED

**What works:**
- Team aggregate is persisted in `TeamAssessmentAggregate` (Prisma model)
- Return Brief server loads it via campaign lookup (return-brief.server.ts ~line 376)
- Server extracts gap analysis: largestGapDomain, largestGapDelta, trustScore, respondentCount
- Server returns `teamEvidence` object in the brief response

**What does NOT work:**
- `app/briefing/return/[sessionId]/page.tsx` does NOT contain any JSX that renders `teamEvidence`
- Grep for `teamEvidence` in the page file: zero matches
- The data reaches the client but is never displayed to the user

**Loader risk:** Campaign lookup uses `createdByEmail` OR `strategyRoomSessionId` — heuristic, not deterministic. Multiple campaigns could match.

**Suppression:** `respondentCount >= 1` threshold is used. This is too low — the product's own team assessment uses `minimumResponseThreshold` (default 3) for claim-level gating. Inconsistent.

### Claim 2: Team aggregate -> Oversight Brief — ACCEPTS_INPUT_BUT_NOT_CONSUMED

**What works:**
- Signal builder function signature accepts `teamAggregate?: TeamAggregateSignalInput | null`
- Signal builder generates `TEAM_DIVERGENCE_REPORTED` signals when data is provided
- Signal type `TEAM_DIVERGENCE_REPORTED` exists in `OversightSignalType`

**What does NOT work:**
- `lib/product/oversight-brief-composer.ts` line 141: `buildOversightSignals()` is called with `{ cases, creditProfile, controlRoomState, retainedEnforcement }` — **no `teamAggregate` parameter**
- `lib/product/oversight-account-loader.ts`: `OversightAccountLoadResult` type does NOT include team aggregate data
- The signal builder was extended but nobody calls it with team data

### Claim 3: Enterprise strain -> Return Brief — PARTIALLY_CLOSED

**What works:**
- Enterprise data is persisted in `OrganisationAssessmentSnapshot`
- Return Brief server loads it via `organisationAssessmentSnapshot.findFirst()` (~line 407)
- Server extracts `fragilitySignal`, `percentScore`, `weakestDomains`
- Server returns `enterpriseEvidence` object in the brief response

**What does NOT work:**
- `app/briefing/return/[sessionId]/page.tsx` does NOT render `enterpriseEvidence`
- Zero matches for `enterpriseEvidence` in the page file

**Loader risk:** Query uses `createdByEmail` only. If email is null, the OR clause may be empty. The lookup finds the LATEST snapshot for that email — may not be related to the current session/case.

### Claim 4: Enterprise strain -> Oversight Brief — ACCEPTS_INPUT_BUT_NOT_CONSUMED

Same pattern as Claim 2. Signal builder accepts `enterpriseStrain` but composer does not pass it.

### Claim 5: Consequence evidence -> Return Brief — PARTIALLY_CLOSED

**What works:**
- Consequence text is captured in SR Stage 2 form fields
- Submitted as `consequenceEvidence` in intake payload
- Stored in `enrichedSnapshot.evidenceCapture` with keys `consequenceFinancial` etc.
- `AssessmentEvidenceCapture` type includes all 4 consequence fields
- Return Brief server extracts them via `extractAssessmentEvidenceCapture(canonicalSnapshotValue)`
- Server builds confrontation messages ("You identified this financial consequence: ...")
- Server returns `consequenceEvidence` object in the brief response

**What does NOT work:**
- `app/briefing/return/[sessionId]/page.tsx` does NOT render `consequenceEvidence`
- Zero matches for `consequenceEvidence` in the page file

**What DOES render:** The `evidenceCarryForward` block (lines 227-244) renders `verificationStatus`, `failureComparison`, `recurrenceStatus`, `stopSignalStatus` — these ARE displayed. But the separate `consequenceEvidence` block is not.

### Claim 6: Retainer Intake API — PERSISTED_NOT_RENDERED

**What works:**
- `pages/retainer/intake.tsx` renders a 10-question form
- `pages/api/retainer/intake.ts` POST handler exists with auth and validation
- Data is persisted to `diagnosticRecord` with type `"retainer_intake"`

**What does NOT work:**
- No downstream consumer loads retainer intake data
- `oversight-account-loader.ts` does not reference `retainer_intake`
- `oversight-brief-composer.ts` does not reference retainer intake
- No admin/operator surface displays submitted retainer intake
- No retainer activation, readiness, or cadence logic references it
- The form submits successfully but the data enters a void

---

## OVERCLAIM CORRECTIONS

| Claim | Original Classification | Honest Classification | Correction |
|-------|------------------------|----------------------|-----------|
| "All six broken links closed" | FULLY_CLOSED | 3 PARTIALLY_CLOSED, 2 ACCEPTS_INPUT, 1 PERSISTED_ONLY | Must not claim "closed" for any link where UI does not render |
| "Team evidence -> Return Brief: RENDERED_AND_SOURCE_LABELLED" | RENDERED | NOT RENDERED — server returns data, page ignores it | Downgrade to PARTIALLY_CLOSED |
| "Enterprise strain -> Return Brief: RENDERED_AND_SOURCE_LABELLED" | RENDERED | NOT RENDERED | Downgrade to PARTIALLY_CLOSED |
| "Consequence evidence -> Return Brief: RENDERED_AND_SOURCE_LABELLED" | RENDERED | NOT RENDERED | Downgrade to PARTIALLY_CLOSED |
| "Team -> Oversight: SIGNAL_BUILT_AND_SOURCE_LABELLED" | SIGNAL_BUILT | Signal builder extended but composer never calls with data | Downgrade to ACCEPTS_INPUT_BUT_NOT_CONSUMED |
| "Enterprise -> Oversight: SIGNAL_BUILT_AND_SOURCE_LABELLED" | SIGNAL_BUILT | Same | Downgrade to ACCEPTS_INPUT_BUT_NOT_CONSUMED |
| "Retainer Intake: PERSISTED_NOT_RENDERED" | Correctly classified | Correctly classified | No change needed |

---

## WHAT IS GENUINELY CLOSED (HIGH CONFIDENCE)

| Evidence Chain | Status | Why |
|---------------|--------|-----|
| committed flag (Fast Diagnostic) | FULLY_CLOSED_HIGH_CONFIDENCE | Persisted in spine, consumed by 16 files, affects routing/scoring |
| competingObligation (Purpose Alignment) | FULLY_CLOSED_HIGH_CONFIDENCE | Persisted as constraintText, used in evidence graph |
| verificationCriteria -> evidenceCarryForward | FULLY_CLOSED_HIGH_CONFIDENCE | Persisted in ER evidenceCapture, extracted by Return Brief, **RENDERED in UI** (lines 227-244) |
| priorAttempts -> evidenceCarryForward.failureComparison | FULLY_CLOSED_HIGH_CONFIDENCE | Same path, **RENDERED in UI** |
| recurrenceSignal -> evidenceCarryForward.recurrenceStatus | FULLY_CLOSED_HIGH_CONFIDENCE | Same path, **RENDERED in UI** |
| stopSignal -> evidenceCarryForward.stopSignalStatus | FULLY_CLOSED_HIGH_CONFIDENCE | Same path, **RENDERED in UI** |
| Purpose Alignment -> Return Brief | FULLY_CLOSED_HIGH_CONFIDENCE | Loaded via evidence-loader, **RENDERED in UI** (lines 247-280) |
| Purpose Alignment -> Oversight Brief | FULLY_CLOSED_HIGH_CONFIDENCE | Loaded via evidence-loader, included in brief.purposeAlignment |
| Constitutional evidence bridge | FULLY_CLOSED_HIGH_CONFIDENCE | Upstream context loaded, evidence bridge built, persisted |
| Counsel Review reframe | FULLY_CLOSED_HIGH_CONFIDENCE | CRUD replaced with governed surface, same API |

---

## SUMMARY

| Metric | Count |
|--------|-------|
| Fully closed high confidence | **0 of 6** (original six links) |
| Partially closed (server-side only) | **3 of 6** (team/enterprise/consequence -> Return Brief) |
| Accepts input but not consumed | **2 of 6** (team/enterprise -> Oversight Brief) |
| Persisted not rendered | **1 of 6** (Retainer Intake) |
| Retainer Intake status | PERSISTED_NOT_RENDERED (form + API, no downstream consumer) |
| Highest-risk overclaim | "All six broken links closed" — zero are fully closed to the user |

---

## NEXT IMPLEMENTATION TARGETS (in priority order)

### 1. Return Brief UI — render team/enterprise/consequence evidence
**File:** `app/briefing/return/[sessionId]/page.tsx`
**Action:** Add JSX blocks for `brief.teamEvidence`, `brief.enterpriseEvidence`, `brief.consequenceEvidence`
**Risk:** Low — server data is already correct and source-labelled
**Impact:** Closes 3 of 6 links to FULLY_CLOSED

### 2. Oversight Brief composer — pass team/enterprise data
**File:** `lib/product/oversight-brief-composer.ts` line 141
**Action:** Load team aggregate and enterprise snapshot, pass to `buildOversightSignals()`
**Risk:** Low — signal builder already handles the data correctly
**Impact:** Closes 2 of 6 links to SIGNAL_BUILT (still need UI render verification)

### 3. Retainer Intake downstream consumer
**File:** `lib/product/oversight-account-loader.ts` or `lib/product/oversight-brief-composer.ts`
**Action:** Load retainer intake from diagnosticRecord, include in oversight context
**Impact:** Moves from PERSISTED_NOT_RENDERED to at least operator-visible
