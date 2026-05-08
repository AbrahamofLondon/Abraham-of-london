# Living Advantage Architecture

> The product is one continuous intelligence system. Each stage gives the user something so useful that continuing feels rational, not coerced.

## The 10-Stage Living Intelligence Journey

### Stage 1: Fast Diagnostic — First Decision Fracture

**User value delivered immediately:**
- Named unresolved decision
- Owner clarity reading
- Blocker type classification (authority / definition / execution / instability)
- First contradiction detected
- Cost-of-delay exposure band
- Immediate first move

**Intelligence added to spine:**
- Case object (decision, owner, blocker, consequence, forced action)
- C3 fidelity score (Clarity / Context / Consequence)
- Deterministic condition class
- Signal archetype

**Engine activated:**
- `lib/decision/case-object.ts` → createCaseObject, inferContradiction, classifyCondition
- `lib/decision/c3-fidelity-scorer.ts` → scoreC3
- `lib/decision/synthesis-engine.ts` → synthesise (tiered: HARD/SOFT/FULL)
- `lib/diagnostics/cost-of-delay-engine.ts` → computeCostOfDelay

**Output produced:**
- FastDiagnosticResult with verdict, contradiction, avoidance, concrete move
- Intelligence spine initialised via createSpine()
- Pressure loop registered (48h/7d/14d follow-up persisted to DB)

**What becomes visible downstream:**
- Constitutional Diagnostic inherits the case object and contradiction
- All subsequent stages see the C3 quality gate
- Pressure loop tracks whether the user acts

**Why continuing is valuable:**
- "You now know the fracture point. The next stage reveals whether this is personal (authority/conviction) or structural (governance/team). That distinction changes the intervention."

**How coercion is avoided:**
- Result is immediately useful without purchasing anything
- "What remains unknown" is clearly stated — user decides if that matters
- No countdown, no guilt, no manufactured urgency

---

### Stage 2: Purpose Alignment — Internal Authority Conflict

**User value:**
- Conviction vs obligation map
- Competing priority identification
- Identity/execution tension
- Decision reliability implication
- Alignment restoration move

**Engine activated:**
- `lib/alignment/PurposeAlignmentAssessment.tsx`
- `lib/diagnostics/evidence-graph.ts` → buildPurposeAuthorityPacket

**Intelligence added:**
- Purpose profile with contradiction evidence
- Decision authority packet
- AI capability contradiction (if detected)

**What becomes visible downstream:**
- Constitutional Diagnostic gains internal authority context
- Executive Reporting gains conviction/obligation dimension

---

### Stage 3: Constitutional Diagnostic — Structural Posture and Route

**User value:**
- Constitutional posture (ORDERED / DRIFTING / MISALIGNED / DISORDERED)
- Authority state (DIRECT / PROXY / UNCLEAR)
- Readiness tier (SOVEREIGN → FRAGILE)
- 9 failure modes with severity
- Route classification (REJECT / DIAGNOSTIC / STRATEGY)
- Rejection/appeal path if routed away

**Engine activated:**
- `lib/constitution/assessment-engine.ts` → runConstitutionalAssessment (9 independent scores)
- `lib/constitution/rules.ts` → evaluateConstitutionalRoute
- `lib/constitution/institutional-learning.ts` → runInstitutionalLearning
- `lib/constitution/evidence-ledger.ts` → buildLedgerFromSpine
- `lib/constitution/route-correction.ts` → runRouteCorrectionSweep

**Intelligence added:**
- Constitutional thread (accumulative, session-scoped)
- Route decision with confidence
- Failure modes and recommended interventions
- Evidence ledger entry (immutable)

**What becomes visible downstream:**
- Team Assessment inherits posture and failure modes
- Enterprise Assessment inherits governance discipline
- Executive Reporting receives constitutional mandate
- Strategy Room receives route classification

---

### Stage 4: Team Assessment — Execution Divergence

**User value:**
- Leader vs team perception gap (when multi-source)
- Divergence severity
- Fragility status (STABLE / VOLATILE / FRACTURED)
- Coordination risk
- Decision interference
- Team-level next action

**Engine activated:**
- `lib/diagnostics/decision-engine.ts` → buildTeamDecisionResult
- `lib/diagnostics/cross-respondent-engine.ts` → aggregateCrossRespondentDiagnostics (when multi-source)
- `lib/alignment/fragility-logic.ts` → calculateFragility

**Intelligence added:**
- Team findings merged into constitutional thread
- Fragility score and dominant gap domains
- Evidence tier: single-source (leader-estimated) or multi-source (cross-validated)

---

### Stage 5: Enterprise Assessment — Institutional Pressure Map

**User value:**
- Governance block scores (Leadership, Governance, Execution, Risk)
- Band classification (ALIGNED / DRIFTING / MISALIGNED / DISORDERED)
- Structural failure mode
- Pressure map
- Escalation route
- Enterprise-level next action

**Engine activated:**
- `lib/diagnostics/decision-engine.ts` → buildEnterpriseDecisionResult
- `lib/alignment/enterprise-score.ts` → enterprise scoring
- `lib/alignment/governance-logic.ts` → computeGovernanceMetrics, simulateInterventionImpact, analyzeContagionRisk

**Intelligence added:**
- Enterprise findings merged into constitutional thread
- Governance cascades and contagion risk analysis
- Institutional pressure dimension

---

### Stage 6: Executive Reporting — Board-Grade Consequence and Action Stack

**User value:**
- Board position statement
- Financial/exposure model (from user data only)
- Confidence band
- Priority stack
- Required interventions
- Governance directive
- Human review option
- Strategy Room bridge

**Engine activated:**
- `lib/decision/canonical-sections.ts` → full CanonicalSections assembly
- `lib/constitution/economic.ts` → computeEconomicExposure
- `lib/constitution/consequence.ts` → buildConsequenceTree
- `lib/decision/recommendation-governance.ts` → governance-filtered recommendations
- `lib/decision/constitutional-guidance-assembler.ts` → assembleConstitutionalGuidance

**Output produced:**
- CanonicalSections: executiveSummary, constitutionalPosture, financialExposure, integritySnapshot, governedRecommendations, priorityStack, failureModes, requiredInterventions

---

### Stage 7: Strategy Room — Execution Environment

**User value:**
- Locked decision record (via ExecutionFlow forcing engine)
- Required move with deadline
- Intervention stack
- Blocker protocol with reason requirement
- Execution ledger (decision states tracked)
- Dynamic consequence scoring (compounds with delay)
- Next review date
- Outcome verification trigger
- Return brief trigger

**Engine activated:**
- `lib/execution/decision-state-engine.ts` → state machine, computeDynamicConsequence, detectRepeatedAvoidance
- `app/api/strategy-room/execution/[id]/decisions/route.ts` → nerve center
- `lib/diagnostics/evidence-graph.ts` → buildGenericAuthorityPacket
- `lib/decision-ledger/ledger-service.ts` → decision credit profile

**What the user sees within 60 seconds:**
"This system knows what decision is at stake, what must happen next, what proves progress, and what happens if execution fails."

---

### Stage 8: Return Brief — Trajectory Correction

**User value:**
- What changed since last reading
- What did not change
- Current trajectory
- Unresolved contradiction (if persistent)
- Revised next move
- Whether escalation is now warranted

**Engine activated:**
- `lib/outcomes/outcome-model.ts` → delta computation, outcome classification
- `lib/diagnostics/longitudinal-comparison.ts` → historical comparison
- `components/diagnostics/results/OutcomeVerification.tsx` → intervention outcome display

---

### Stage 9: Outcome Verification — Truth Loop

**User value:**
- 14-day check-in: "Did you act?"
- 30-day outcome review: "Did it work?"
- Classification: resolved / improved / stable / deteriorated
- What remains unresolved
- Whether the intervention held

**Engine activated:**
- `lib/outcomes/outcome-verification.ts` → verifyOutcomeMovement, verifyAndPersistOutcome
- `lib/outcomes/evidence.ts` → recordOutcomeSnapshot (persists to DB), buildObservedOutcomeEvidence
- `lib/outcomes/feedback-loop.ts` → recordOutcomeFeedback

---

### Stage 10: Decision Credit / Institutional Memory — Compounding Advantage

**User value:**
- Decision reliability score (follow-through pattern)
- Improvement trajectory
- Evidence tier achieved
- Institutional memory (the system remembers and compounds)

**Engine activated:**
- `lib/follow-up/decision-credit-score.ts` → computeDecisionCreditScore
- `lib/follow-up/integrity-scoring.ts` → computeIntegrityScore
- `lib/calibration/calibration-engine.ts` → prediction vs outcome calibration

**Why this is an unfair advantage:**
The intelligence spine is immutable and accumulative. Every stage adds evidence. Contradictions that persist are flagged. Outcomes are verified against predictions. The system learns from every case via institutional learning. No competitor can replicate this depth from a single interaction.

---

## Integration: Google Calendar Sync

**File:** `lib/integrations/google-calendar-sync.ts`

**What it does:** Fetches calendar events via Google Calendar API v3 and extracts behavioral signals (meeting completion, response patterns) for Pattern-Breaker Contract verification.

**Strategy Room integration:**
- Verify whether committed actions (meetings scheduled, reviews completed) actually happened
- Feed into outcome verification loop as behavioral evidence
- Strengthen decision credit score with objective action data
- Move from self-reported "I did it" to verified "the calendar confirms it"

**Post-sale value:**
- Passive verification of execution without user effort
- Strengthens evidence tier from "single-source" to "outcome-verified"
- Creates continuous intelligence feed between sessions

**Activation path:** Wire into PatternBreakerContract verification → DecisionCreditScore → OutcomeVerification loop.
