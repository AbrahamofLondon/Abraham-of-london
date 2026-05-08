# Living Case Constitution

**Date:** 2026-05-07
**Authority:** Decision Infrastructure by Abraham of London
**Doctrine:** The Living Case is the atomic product object. Everything else is an interface into it.

---

## Governing Principle

The system does not optimise for completion of assessments. It optimises for continuity of governed intelligence.

Assessment completion is a surface metric. The real metrics are:

- decision completion
- contradiction resolution
- outcome verification
- return intelligence quality
- execution reliability
- evidence maturity
- reduction in repeated failure patterns
- escalation accuracy
- intervention effectiveness
- institutional memory density

---

## Canonical Entities

### Case

**Meaning:** The root container for a governed intelligence relationship. A Case represents a decision landscape — one or more interconnected decisions under institutional pressure — tracked across sessions, assessments, interventions, and outcomes.

**Source:** Created implicitly when a user enters any diagnostic surface with identifiable context (email, subjectId, or campaignId).

**Lifecycle:** Open → Active → Under Intervention → Monitoring → Resolved | Persistent

**Required fields:** `caseId`, `subjectKey`, `createdAt`, `status`

**Relationships:** Contains Decisions, Evidence, Contradictions, Directives, Exposures, Interventions, Execution States, Governance Events, Outcomes, Calibration Records, Patterns.

**Surfaces that create:** Any diagnostic entry (Fast, Purpose Alignment, Constitutional, Team, Enterprise). **Surfaces that read:** All diagnostic results, Executive Reporting, Strategy Room, Return Brief. **Surfaces that update:** All downstream stages, outcome verification.

**Current implementation:** `DiagnosticJourney` in Prisma (journeyKey, subjectKey, stages, tensions, escalationHistory, routeDecisions, evidenceNodes, decisionObjects).

---

### Decision

**Meaning:** A specific decision under pressure — named, owned, consequential. Not an abstract intention.

**Source:** Extracted from user input via diagnostic questions. Normalised into a canonical object.

**Lifecycle:** Stated → Validated → Governed → Executed → Verified | Unresolved

**Required fields:** `decisionKey`, `decisionText`, `sourceStage`, `confidence`

**Relationships:** Belongs to Case. Has Evidence, Contradictions, Exposures, Directives, Interventions, Execution States, Outcomes.

**Current implementation:** `DiagnosticDecisionObject` (decisionKey, decisionText, constraintText, priorAttemptText, costOfDelayText, stakeholderText, normalized, confidence, aiExposureLevel, decisionVelocityScore, forwardTerrainState).

---

### Contradiction

**Meaning:** A detected misalignment between stated position and evidenced reality, or between two evidence sources. Contradictions compound in severity until resolved.

**Source:** Scoring engines, cross-respondent analysis, cross-stage comparison.

**Lifecycle:** Detected → Confirmed → Compounding → Resolved | Persistent

**Required fields:** `sourceStage`, `kind`, `label`, `summary`, `severity`, `confidence`

**Relationships:** Belongs to Case and Decision. May trigger Directives, Escalation, Restriction.

**Current implementation:** `DiagnosticEvidenceNode` with `kind: "contradiction"`.

---

### Exposure

**Meaning:** A quantified or classified risk surface — financial, operational, reputational, governance.

**Source:** Cost-of-delay engine, economic exposure models, consequence tree builder.

**Lifecycle:** Estimated → Confirmed → Priced → Mitigated | Realised

**Required fields:** `sourceStage`, `exposureType`, `estimate`, `confidence`

**Relationships:** Belongs to Decision. Informs Directives, Interventions, Executive Reporting.

**Current implementation:** `LivingIntelligenceSpine.exposureModel` (costOfDelay, economicExposure, consequenceTree, governanceImpact).

---

### Intervention

**Meaning:** A governed action taken in response to a Decision, Contradiction, or Exposure. Not a suggestion — a directed, accountable move.

**Source:** Strategy Room execution, Executive Reporting priority stack, governed action panels.

**Lifecycle:** Proposed → Directed → Acknowledged → Executed → Verified

**Required fields:** `interventionId`, `decisionId`, `action`, `owner`, `deadline`

**Relationships:** Belongs to Decision. Produces Execution States and Outcomes.

**Current implementation:** `LivingIntelligenceSpine.interventionStack` (requiredNextMoves with confidence, rationale). `StrategyRoomExecutionRecord` (decision, authority, conflictResolved, firstAction, owner).

---

### Directive

**Meaning:** A system-issued instruction — ALLOW, RESTRICT, REJECT, PREPARE, WATCH. Governs what the user or institution may do next.

**Source:** Constitutional routing engine, admission modules, authority enforcement.

**Lifecycle:** Issued → Active → Superseded | Expired

**Required fields:** `directiveType`, `reason`, `sourceStage`, `issuedAt`

**Relationships:** Controls progression between surfaces. May restrict or admit.

**Current implementation:** `EnforcementResult.directive` (level, reason, recommendedPath). Constitutional routing (STRATEGY/DIAGNOSTIC/REJECT).

---

### Escalation

**Meaning:** A governed transition from one intelligence tier to a deeper one. Not a purchase — an evidence-justified progression.

**Source:** Routing engines, admission modules, evidence tier progression.

**Lifecycle:** Qualified → Admitted → Active → Completed

**Required fields:** `fromSurface`, `toSurface`, `justification`, `evidenceTier`

**Relationships:** Connects Cases across surfaces. Requires Directive.

**Current implementation:** `DiagnosticJourneyRecord.escalationHistory`. Route decisions stored per stage.

---

### Execution State

**Meaning:** The tracked state of a decision after intervention has been directed.

**Source:** Strategy Room execution sessions, return brief trajectory analysis.

**Lifecycle:** Initiated → In Progress → Stalled → Completed → Verified

**Required fields:** `sessionId`, `systemState`, `consequenceScore`, `trend`

**Relationships:** Belongs to Case and Decision. Produces Outcomes.

**Current implementation:** `LivingIntelligenceSpine.executionState` (systemState, consequenceScore, trend, executedActions, pendingActions). `StrategyRoomExecutionSession`.

---

### Outcome

**Meaning:** The verified result of an intervention at 14 and 30 days. Not self-reported satisfaction — measured state change.

**Source:** Return Brief generation, outcome verification engine.

**Lifecycle:** Pending → Observed → Classified (Resolved | Improved | Stabilised | Worsened | Persistent)

**Required fields:** `sessionId`, `observedAt`, `classification`, `evidenceBasis`

**Relationships:** Belongs to Execution State. Updates Case memory and Decision Credit.

**Current implementation:** `OutcomeVerificationRecord`. `OutcomeEvidenceSummary` (classification, confidence, observedImprovements, persistentIssues).

---

### Evidence

**Meaning:** A unit of signal — observed, scored, or inferred — that supports or challenges a Decision, Contradiction, or Exposure.

**Source:** All diagnostic engines, respondent inputs, outcome observations.

**Lifecycle:** Captured → Graded → Confirmed → Compounded | Stale

**Required fields:** `sourceStage`, `kind`, `label`, `summary`, `confidence`, `severity`

**Relationships:** Belongs to Case. Supports or challenges Decisions, Contradictions, Exposures.

**Current implementation:** `DiagnosticEvidenceNode` (sourceStage, kind, label, summary, evidenceText, confidence, severity, payload).

---

### Trust Score (Decision Credit)

**Meaning:** A compound score reflecting the quality and reliability of an individual's or institution's decision history within the system.

**Source:** Ledger service aggregation across decisions, contracts, outcomes.

**Lifecycle:** Initialised → Accumulating → Mature → Calibrated

**Required fields:** `email`, `baseScore`, `trend`

**Relationships:** Informs Admission decisions, Directive severity, Escalation qualification.

**Current implementation:** `CreditProfile` from `getCreditProfile()` (baseScore, trend, fulfilled/breached/disputed counts).

---

### Calibration Record

**Meaning:** A record of the system calibrating its own accuracy — comparing predictions against observed outcomes.

**Source:** Return Brief trajectory analysis, outcome verification delta.

**Lifecycle:** Recorded → Analysed → Applied to future scoring

**Required fields:** `predictionId`, `predictedOutcome`, `observedOutcome`, `delta`

**Relationships:** Belongs to Case and Outcome. Feeds institutional learning.

**Current implementation:** `CalibrationRecord` model in Prisma. `calibration/route.ts` API endpoint.

---

### Pattern

**Meaning:** A recurring signal across multiple decisions, sessions, or time periods. Patterns that persist are structural, not accidental.

**Source:** Cross-session analysis, pattern recurrence detection, contradiction persistence.

**Lifecycle:** First Signal → Repeated → Confirmed Pattern → Resolved | Structural

**Required fields:** `patternKey`, `signalCount`, `firstSeen`, `lastSeen`, `status`

**Relationships:** Belongs to Case. Informs Directives and Escalation.

**Current implementation:** Evidence nodes with `kind: "pattern_recurrence"`. `PatternBreakerContract` model.

---

### Organisation

**Meaning:** The institutional entity associated with a Case. May be a company, board, division, or governance unit.

**Source:** User input during diagnostic intake. Normalised.

**Lifecycle:** Identified → Active → Monitored

**Required fields:** `organisationKey`, `name`

**Relationships:** Contains Cases, Actors, Campaigns.

**Current implementation:** `DiagnosticJourneyRecord.organisation`, `organisationKey`.

---

### Campaign

**Meaning:** A coordinated multi-respondent assessment exercise within an Organisation.

**Source:** Team Assessment or Enterprise Assessment with respondent mode.

**Lifecycle:** Created → Open → Collecting → Closed → Analysed

**Required fields:** `campaignId`, `organisationKey`, `mode`, `status`

**Relationships:** Belongs to Organisation. Contains respondent evidence.

**Current implementation:** Team assessment campaign models with invite tokens.

---

### Actor

**Meaning:** A named participant in a Case — the decision owner, authority holder, stakeholder, or respondent.

**Source:** Diagnostic input (authority questions), respondent submissions, stakeholder mapping.

**Lifecycle:** Identified → Active → Accountable → Verified

**Required fields:** `email` or `role`, `caseId`

**Relationships:** Belongs to Case and Organisation. May own Decisions.

**Current implementation:** `DecisionStakeholder` model. Actor data in diagnostic intake.

---

### Governance Event

**Meaning:** A recorded event where the system exercised governance — admitted, restricted, refused, escalated, or directed.

**Source:** Admission modules, enforcement functions, routing engines.

**Lifecycle:** Occurred → Logged → Auditable

**Required fields:** `eventType`, `surface`, `actorEmail`, `directive`, `reason`, `timestamp`

**Relationships:** Belongs to Case. Creates audit trail.

**Current implementation:** `SystemAuditLog` (action, severity, actorEmail, resourceType, resourceId, metadata).

---

## Entity Relationship Summary

```
Case
├── Decision(s)
│   ├── Evidence
│   ├── Contradiction(s)
│   ├── Exposure(s)
│   ├── Directive(s)
│   ├── Intervention(s)
│   │   ├── Execution State
│   │   └── Outcome(s)
│   └── Calibration Record(s)
├── Pattern(s)
├── Trust Score (Decision Credit)
├── Governance Event(s)
├── Organisation
│   ├── Campaign(s)
│   └── Actor(s)
└── Memory (accumulated across sessions)
```
