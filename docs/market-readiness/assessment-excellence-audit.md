# Assessment Excellence Audit

Generated: 2026-05-07
Auditor: Claude Opus 4.6 (1M context)
Scope: All six assessment instruments in the Abraham of London diagnostic ladder

---

## 1. Purpose Alignment Assessment

**Route:** `/purpose-alignment` (App Router, wraps `lib/alignment/PurposeAlignmentAssessment.tsx`)
**Role in ladder:** Parallel/support surface. Not the canonical Stage 1 entry (that is Constitutional Diagnostic).

### Structure

- **Phase 1 (Context):** 3 free-text interrogation steps:
  1. "What decision are you currently avoiding or deferring?"
  2. "What competing obligation or priority is pulling against that decision?"
  3. "What becomes worse if this remains unresolved?"
- **Phase 2 (Signal):** 18 dual-axis statements (resonance 0-10 + certainty 0-10) across 6 domains: Identity & Mandate, Decision Integrity, Environmental Alignment, Operational Behaviour, Emotional & Internal Order, Legacy Orientation. Paginated into 3 groups of 2 domains each.
- **Phase 3 (Result):** Pattern classification, anchor narrative (condition, why, pattern, cost of inaction at 30/60/90 days, required move, perspective), contradiction mapping, domain profiles.

### Question Types
- Free-text (3 context questions)
- Dual-axis sliders: resonance + certainty (18 signal questions)
- Total: 21 inputs

### Challenge Engine
Active. Runs at each context step (`stated_purpose`, `competing_obligation`, `pre_result`). Severity levels: none, clarify, challenge, block. Also runs integrity detection on dual-axis answers (pattern detection for flat-lining, speed gaming).

### Resume Capability
Yes. Uses `loadAssessmentState` / `saveAssessmentState` from `lib/client/assessment-state.ts`. Presents "Resume your assessment?" dialog with timestamp of saved session.

### Result Quality
- Anchor narrative is server-generated (API call to `/api/purpose-alignment/assessments`)
- Falls back to local scoring via `scorePurposeProfile` if server fails
- "How this was determined" section reflects user's specific inputs
- Contradiction mapping shows specific evidence
- "Cost of inaction" at 30/60/90 days (server-personalised or fallback generic)

### Email Capture
Present in two positions: (1) `ResultEmailCapture` component in result section, (2) dedicated "Save your result and track this pattern" section with email input and anonymous option. Cadence tracking: 14-day re-evaluation.

### Next Stage CTA
Links to `/diagnostics/team-assessment` ("Run Team Diagnostic") and PDF download. No dead end.

### Design Language
Light theme (cream/white background, neutral-950 text). Rounded cards (32px radius). Different visual language from the rest of the ladder which uses dark institutional monumentalism. This is notable -- it breaks visual continuity with the diagnostic ladder.

| Criterion | Score /10 | Evidence |
|-----------|----------|----------|
| Bespoke feel (not template) | 8 | Context interrogation personalises everything; dual-axis is unusual |
| Hard to game | 8 | Integrity detection on dual-axis (flat-line, speed); challenge engine on context |
| Mobile usable | 7 | Responsive classes, but 18 dual-axis sliders on mobile is heavy; sticky bottom nav helps |
| Emotionally credible | 8 | "What decision are you avoiding?" — immediate personal stake |
| Result explains WHY | 9 | Anchor narrative with condition, pattern, contradiction mapping, trigger explanation |
| Connected to next stage | 7 | CTA to team assessment exists but feels appended rather than narratively driven |
| Resume works | 9 | Versioned state with resume dialog |
| Email capture present | 9 | Two positions, anonymous option, 14-day cadence |
| No dead end after result | 8 | Team diagnostic CTA + PDF download + email capture |
| No placeholder copy | 8 | Fallback copy is generic but reads as structural, not placeholder |

**Average: 8.1/10**

---

## 2. Fast Diagnostic

**Route:** `/diagnostics/fast` (Pages Router, `pages/diagnostics/fast.tsx`)
**Role in ladder:** Quick entry point. "Decision Check" -- 2 minutes. Pre-ladder.

### Structure

- **Hero:** Provocation ("You don't have an execution problem. You have a decision structure problem.") with "Find the break" CTA
- **3 interrogation steps** (free-text textareas):
  1. "What decision has been sitting unresolved longer than it should?"
  2. "Who can actually make this decision binding?"
  3. "What becomes more expensive if this stays unresolved?"
- **Commitment gate:** "If this identifies the real blocker, will you act on it within 48 hours?" (Yes/No with consequences for declining)
- **Result:** Full governed analysis with Opening, Condition, Mirror Line, Why It Exists, Pattern, Cost of Inaction (30/60/90), External View, Required Move, Executive Decision Authority Block

### Question Types
- Free-text only (3 questions)
- Commitment binary (yes/no)
- Minimum 8 characters per answer to advance
- Total: 3 text inputs + 1 commitment

### Challenge Engine
Active. Calls `/api/diagnostics/challenge` at each step (`decision_input`, `ownership`, `pre_result`). Dynamic follow-ups via `DecisionChallengeCard` with revise/accept flow. Blocked challenges prevent advancement.

### Live Hint System
Real-time feedback while typing (400ms debounce):
- Step 1: detects outcome language ("want to", "hope to"), vague inputs, insufficient specificity
- Step 2: detects shared/unclear ownership ("everyone", "the team", "committee")
- Step 3: detects abstract consequences ("things will", "nothing", "more of the same")

This is a standout feature -- genuinely hard to game.

### Resume Capability
Yes. Uses `loadVersionedAssessmentState` / `saveVersionedAssessmentState` with key `aol-fast-assessment-state` and version `2026-04-standardized`. Shows "Continue your session" / "Start fresh" buttons on hero.

### Result Quality
- Server-generated via `/api/diagnostics/score` producing `FastDiagnosticResult`
- `anchorNarrative` personalises every section
- "How this was determined" section directly quotes user inputs
- Recovery question mechanism: if signal is too weak, routes to "More detail required" instead of a weak result
- Tracks elapsed time, commitment status

### Email Capture
`ResultEmailCapture` component positioned after the "Mirror Line" and before "Why It Exists" -- above fold in results. Good placement.

### Next Stage CTAs
Two escalation paths:
1. "Continue to Purpose Alignment" (narrative hook: "What is not yet clear is whether this is personal or systemic")
2. "Move this into a controlled decision environment" -> Executive Reporting

### Design Language
Dark institutional (rgb(3,3,5) background, gold accents, JetBrains Mono + Cormorant Garamond). Consistent with ladder aesthetic.

| Criterion | Score /10 | Evidence |
|-----------|----------|----------|
| Bespoke feel (not template) | 9 | Live hints, commitment gate, recovery question -- all unique |
| Hard to game | 9 | Live hint system catches vague/outcome/avoidance language in real time |
| Mobile usable | 8 | Full-screen stages, textarea inputs, clamp() typography, touch-friendly buttons |
| Emotionally credible | 9 | "You already know this. You've been circling it." -- mirror line is powerful |
| Result explains WHY | 9 | Condition + Why It Exists + Pattern + "How this was determined" with quoted inputs |
| Connected to next stage | 9 | Dual CTA (Purpose Alignment + Executive Reporting) with narrative justification |
| Resume works | 9 | Versioned state with resume/fresh options |
| Email capture present | 8 | Present in result, good position, but single placement |
| No dead end after result | 9 | Two forward paths + reset option |
| No placeholder copy | 7 | Fallback copy (when anchorNarrative is null) is generic but serviceable |

**Average: 8.6/10**

---

## 3. Constitutional Diagnostic

**Route:** `/diagnostics/constitutional-diagnostic` (Pages Router, wraps `ConstitutionalDiagnostic` component)
**Role in ladder:** Layer 01 -- Entry Gate. The canonical Stage 1 entry point.

### Structure

- **Hero:** Full institutional presentation with instrument specification panel, ladder position indicator, breadcrumb navigation
- **Instrument Specification (displayed):** 10 dual-axis statements, resonance x certainty weight, 9 constitutional domains, V2.2 sovereign routing kernel, routes to STRATEGY/DIAGNOSTIC/REJECT
- **10 questions** across domains: coherence, authority, environment, execution, trust, friction, stakes, pattern, pressure. Each uses dual-axis (resonance 0-10 + certainty 0-10)
- **Result:** Full constitutional report with authority score, coherence, pressure, friction, trust, seriousness, governance discipline, intervention readiness, narrative coherence, failure modes, readiness tier, posture, route decision, bridge bundle for downstream assessments

### Question Types
- Dual-axis sliders only (resonance 0-10 + certainty 0-10)
- 10 questions total
- Certainty acts as weight: `0.45 + certainty/18` (range 0.45 to 1.0)
- Reverse-scored questions for environment, execution, friction, pattern

### Challenge Engine
Active. Runs integrity detection via `detectDualAxisIntegrityChallenge` on answers (catches flat-lining, speed gaming). Also has `ChallengeResult` state.

### Resume Capability
Yes. Uses versioned assessment state (`aol-constitutional-diagnostic-state`, version `2026-04-standardized`). Shows resume dialog.

### Result Quality
- Full constitutional micro-report computed locally
- Submitted to server API for bridge bundle and route decision
- Routes to STRATEGY, DIAGNOSTIC, or REJECT with confidence score
- Key findings array, failure modes, readiness tier (FRAGILE/EMERGING/STABILIZING/EXECUTION_READY/SOVEREIGN)
- Authority type classification (DIRECT/PROXY/UNCLEAR)
- Bridge bundle passes intelligence downstream to team/enterprise assessments

### Inherited Context (Spine)
Reads intelligence spine from session -- if a prior stage (e.g., Purpose Alignment) has been completed, displays "Intelligence inherited from prior stage" with headline and contradiction detection.

### Email Capture
`ResultEmailCapture` present in result (visible in component).

### Next Stage CTAs
Footer explicitly links to "Team Assessment" with ChevronRight. Ladder position shows 01 of 04. "Diagnostic ladder" link also present.

### Design Language
Dark institutional monumentalism. Gold radial gradient hero, grain texture overlay, layered opacity system. Most visually authoritative page in the ladder.

| Criterion | Score /10 | Evidence |
|-----------|----------|----------|
| Bespoke feel (not template) | 9 | Instrument spec panel, dual-axis with certainty weighting, constitutional routing |
| Hard to game | 9 | Certainty weighting penalises uninformed answers; integrity detection; reverse scoring |
| Mobile usable | 7 | Slider inputs on mobile can be imprecise; 10 questions with dual sliders is demanding |
| Emotionally credible | 8 | "Before strategy, the constitution" -- serious but could feel clinical to some |
| Result explains WHY | 9 | Posture, readiness tier, failure modes, route rationale, key findings |
| Connected to next stage | 9 | Bridge bundle carries intelligence to next assessment; explicit Team Assessment CTA |
| Resume works | 9 | Versioned state with resume dialog |
| Email capture present | 8 | Present in results via ResultEmailCapture |
| No dead end after result | 9 | Routes to STRATEGY/DIAGNOSTIC/REJECT with specific CTAs; Team Assessment link |
| No placeholder copy | 9 | All copy is structural; no visible placeholder text |

**Average: 8.6/10**

---

## 4. Team Assessment

**Route:** `/diagnostics/team-assessment` (Pages Router, 800+ lines)
**Role in ladder:** Layer 02. "Does your team share your reality?"

### Structure

- **Phase 1 (Identity):** respondentName, respondentEmail, respondentRole, organisation, teamName, teamSize, notes
- **Phase 2 (Leader Perception):** 4 domains x 3 dual-axis prompts = 12 questions. Domains: Direction & Priority, Execution Integrity, Trust & Communication, Authority & Escalation. Prefix: "From my position, the team..."
- **Phase 3 (Reality Estimate):** Same 12 prompts but prefix changes to "Team members would say they..." -- leader estimates how team would rate themselves
- **Phase 4 (Result):** Gap analysis, fragility classification (Bessel-corrected stddev), escalation routing

### Question Types
- Free-text (identity phase: 7 fields)
- Dual-axis (resonance + certainty): 24 total (12 leader + 12 reality estimate)
- Team reflections: confidenceBaseline slider, falseAssumption text, showScoresReaction text
- Total: 31+ inputs

### Gap Analysis Architecture
The diagnostic finding is the gap between Phase 2 (leader perception) and Phase 3 (leader's estimate of team reality). This is genuinely sophisticated:
- Per-domain gap calculation with severity classification (CRITICAL >= 30, HIGH >= 20, MEDIUM >= 10, LOW)
- `deriveGapReading()` produces specific pattern titles:
  - "Systemic coherence strain" (2+ critical domains)
  - "Trust no longer load-bearing" (trust gap >= 20)
  - "Authority not sufficiently ordered" (authority gap >= 20)
  - "Motion without alignment" (execution gap >= 20)
  - "Readiness suppressed by deflation" (team rates higher than leader)
  - "Manageable variance under watch"
  - "Coherent team signal"
- Fragility engine: Bessel-corrected standard deviation classification (FRACTURED/VOLATILE/STABLE)

### Challenge Engine
Active. `runTeamChallenge()` calls `/api/diagnostics/challenge` with team-specific stage. Also runs `detectDualAxisIntegrityChallenge` on dual-axis answers.

### Resume Capability
Yes. Versioned state (`aol-team-assessment-state`, `2026-04-standardized`). Saves phase, identity, scores, reflections, page positions, startedAt.

### Result Quality
- Gap visualisation: animated bars showing leader vs team perception per domain
- Colour-coded severity (red for critical, amber for high, gold for medium, green for low)
- Structural reading with full paragraph explanation specific to detected pattern
- "How this was determined" with specific per-domain evidence
- Links to Purpose Alignment score if available (cross-assessment intelligence)
- Constitutional thread inheritance: displays findings from prior constitutional diagnostic
- Trajectory line, recommended playbooks, free layer boundary disclosure
- Unified conversion surface: CaseActiveBanner, ConsequenceTimeline, Limitations, DirectiveCTA, FeedbackLoop

### Email Capture
`ResultEmailCapture` in result headline section. Good positioning.

### Connection to Enterprise
Explicit "Next unknown" section: "This is not a team issue alone. The structure itself is allowing this to persist." Links to `/diagnostics/enterprise-assessment` with narrative justification specific to detected pattern and gap severity.

### Design Language
Dark institutional. Consistent with Constitutional Diagnostic.

| Criterion | Score /10 | Evidence |
|-----------|----------|----------|
| Bespoke feel (not template) | 9 | Leader vs reality estimate gap is a unique diagnostic architecture |
| Hard to game | 9 | Dual-axis + integrity detection + challenge engine; gap between two passes catches inflation |
| Mobile usable | 6 | 24 dual-axis inputs across two phases is very heavy on mobile; paginated but still demanding |
| Emotionally credible | 9 | "Does your team share your reality?" -- gap revelation is psychologically powerful |
| Result explains WHY | 10 | Per-domain gaps, fragility classification, specific pattern reading, cross-assessment context |
| Connected to next stage | 9 | Narrative-driven escalation to Enterprise Assessment with specific justification |
| Resume works | 9 | Full phase/scores/reflections saved and restorable |
| Email capture present | 8 | Present in results |
| No dead end after result | 9 | Enterprise CTA, recommended playbooks, save record, feedback loop |
| No placeholder copy | 9 | All readings are structurally derived from actual gap calculations |

**Average: 8.7/10**

---

## 5. Enterprise Assessment

**Route:** `/diagnostics/enterprise-assessment` (Pages Router, 800+ lines)
**Role in ladder:** Layer 03. Tests whether strain is local or institutional.

### Structure

- **Phase 1 (Identity):** name, email, organisation, role, recentDecision (free-text -- "Name one recent high-stakes decision"), notes
- **Phase 2 (Instrument):** 4 blocks x 3 dual-axis prompts = 12 questions. Blocks:
  1. **Leadership Coherence** (Authority & signal): leadership reading consistency, disagreement surfacing, strategic messaging coherence
  2. **Governance Reliability** (Structure & accountability): decision rights clarity, escalation/accountability, governance supporting execution
  3. **Execution Variance** (Operating consistency): performance variance bounds, priority interpretation consistency, operational signal trustworthiness
  4. **Institutional Risk Posture** (Consequence & urgency): delay cost, trust erosion, corrective action resistance
- **Phase 3 (Result):** Band classification, section analysis, dominant failure mode, escalation routing

### Institutional Blocks Assessed
1. Leadership Coherence
2. Governance Reliability
3. Execution Variance
4. Institutional Risk Posture

### Band Classification
STABLE (>= 80%) / WATCH (>= 60%) / FRAGILE (>= 40%) / ESCALATE (< 40%)

### Analysis Engine
`deriveReading()` produces specific patterns based on which combinations are weak:
- "Distributed constitutional strain" (all four below boundary)
- "Authority and governance out of order" (leadership + governance weak)
- "Execution drift under rising pressure" (execution + risk weak)
- "Leadership signal no longer coherent"
- "Governance no longer carrying order"
- "Operating layer drifting from intent"
- "Risk posture no longer stable"
- "Institutional posture remains ordered" (stable)
- "Watch condition under moderate strain" (default)

### Decision Signal Integration
`recentDecision` free-text input is processed through `deriveDecisionSignalFromEnterpriseInput()` producing clarity score, structural risk, and signal strength. This grounds the assessment in an actual decision, not abstract scoring alone.

### Cross-Assessment Intelligence
- Reads team assessment result from sessionStorage (`teamAlignmentPct`)
- Compounds findings: "Your Team Assessment reading of X% compounds this enterprise reading"
- Reads constitutional thread and displays inherited context

### Challenge Engine
Active via `DecisionChallengeCard` and `detectDualAxisIntegrityChallenge`.

### Resume Capability
Yes. Versioned state (`aol-enterprise-assessment-state`, `2026-04-standardized`).

### Email Capture
`ResultEmailCapture` in result headline section.

### Route to Executive Reporting
Result routes to EXECUTIVE_REPORTING, STRATEGY_ROOM, or WATCH with specific structural justification. Link to `/diagnostics/executive-reporting` when EXECUTIVE_REPORTING route is triggered.

### Design Language
Dark institutional. Consistent with ladder.

| Criterion | Score /10 | Evidence |
|-----------|----------|----------|
| Bespoke feel (not template) | 9 | Decision signal integration; cross-assessment intelligence; institutional-grade vocabulary |
| Hard to game | 8 | Dual-axis + integrity; decision signal grounds abstract scores in reality |
| Mobile usable | 7 | 12 dual-axis inputs is manageable; identity phase is straightforward |
| Emotionally credible | 8 | "The institution has already moved from operational difficulty into structural danger" |
| Result explains WHY | 10 | Section breakdown, dominant failure mode, decision signal metrics, cross-assessment context |
| Connected to next stage | 9 | Explicit Executive Reporting routing with structural justification |
| Resume works | 9 | Full versioned state |
| Email capture present | 8 | Present in results |
| No dead end after result | 9 | Executive Reporting CTA, Strategy Room CTA, Watch state CTA, playbooks, save record |
| No placeholder copy | 9 | All readings derived from actual score combinations |

**Average: 8.6/10**

---

## 6. Executive Reporting

**Route:** `/diagnostics/executive-reporting` (gate page) + `/diagnostics/executive-reporting/run` (post-payment intake + report)
**Role in ladder:** Layer 04 -- Paid tier. Board-grade consequence interpretation.

### Gate Page (executive-reporting.tsx)

**This is the pre-payment sales and evidence page.** It:
- Loads user evidence from all prior assessments (sessionStorage: fast, purpose, team, enterprise)
- Displays personalised decision exposure quoting user's actual inputs
- Shows consequence snapshot at 30/60/90 days personalised with evidence
- Evidence accumulated section: checklist of which assessments are completed
- Report preview: 3 sections (Executive Decision Finding, Structural Contradiction, Cost of Inaction) personalised from evidence
- "How this was determined" transparency section
- Email capture above paywall
- `ExecutiveReportingPaywall` component with Stripe checkout
- Strategy Room bridge for qualified users (3+ assessments completed)
- Server-side access enforcement via `enforceExecutiveReportingAccess`

### Run Page (executive-reporting/run.tsx)

**Post-payment intake form.** Structured intake with:
- Identity: fullName, email, organisation, role, sector
- Structured context: authorityScope, boardInvolved, revenueBand, decisionWindow, headcountAffected, stakeholderBreadth
- High-yield free-text (each has a named downstream consumer):
  - `decisionQuestion` -> position statement, contradiction map
  - `whatHappensIfNothingChanges` -> consequence pricing, cost of delay
  - `currentConstraint` -> priority stack constraints, action sequencing
  - `priorAttemptOutcome` -> pattern engine, correction history
- Reads ladder upstream context from sessionStorage (enterprise, team, purpose results)

### Report Output (ExecutiveReportViewModel)
Board-grade output structure:
- Header: reportId, classification, route, authorityType, readinessTier, confidence
- Summary: state, headline, mandate, primaryConstraint, structuralImplication, failureModes, priorityStack, requiredInterventions, dominantDomains, rationale
- Telemetry: averageDissonance, burnoutIndex, sovereignCertainty, per-domain intent/reality/dissonance
- Financial Exposure: replacementCost, executionLoss, totalExposure (formatted GBP)
- Observed Outcomes: processedDecisionCases, comparableCaseCount, improvedPercent, failureRateWhenIgnored, confidence level
- Constitution: full posture breakdown
- Governed Recommendations: matched assets, scored recommendations with reasons

### Additional Intelligence Layers (run.tsx)
- AI interpretation via `useInterpretation` hook
- Decision terrain status
- AI terrain exposure assessment
- Competitive position signal
- Board snapshot
- Advantage path block
- Predictive consequence projection
- Multi-stakeholder divergence
- Longitudinal intelligence
- Outcome verification
- Engagement readiness panel
- Retainer entry gate qualification
- Strategy Room conversion bridge
- Proof capture prompt

### Is the Output Board-Grade?
Yes. The report includes:
- Financial exposure with GBP figures
- Observed outcomes with statistical confidence levels
- Priority stack with governed sequencing
- Failure modes and required interventions
- Constitutional posture with domain-level breakdowns
- Board actions list
- Classification and route designation
- This is the most comprehensive output in the system

### Server-Side Enforcement
`enforceExecutiveReportingAccess` checks email, subjectId, campaignId, intake mode, sponsored access, monitoring context. Redirects to constitutional-diagnostic if not authorised.

### Checkout Verification
`verifyCheckoutSessionForProduct` confirms Stripe payment before granting access to run page.

| Criterion | Score /10 | Evidence |
|-----------|----------|----------|
| Bespoke feel (not template) | 10 | Every section personalised from accumulated ladder evidence; board-grade financial output |
| Hard to game | 9 | Paywall + server-side access enforcement + intake structure requires real organisational detail |
| Mobile usable | 6 | Extensive intake form with many fields; report output is very long; scrolling-heavy |
| Emotionally credible | 9 | Gate page mirrors user's own words back; "You have seen the diagnosis. You have not yet seen the full consequence." |
| Result explains WHY | 10 | Financial exposure, failure modes, rationale arrays, observed outcomes, constitutional posture |
| Connected to next stage | 9 | Strategy Room bridge, retainer gate, proof capture, advantage path |
| Resume works | 5 | No visible resume mechanism on intake form; checkout state handled server-side but intake is not persisted |
| Email capture present | 9 | On gate page above paywall; email collected in intake form |
| No dead end after result | 9 | Strategy Room, retainer entry, proof capture, advantage path |
| No placeholder copy | 9 | All evidence-driven; financial figures derived from intake |

**Average: 8.5/10**

---

## Summary Scorecard

| Assessment | Avg Score | Strongest | Weakest |
|------------|-----------|-----------|---------|
| Purpose Alignment | 8.1 | WHY explanation (9), Resume (9), Email (9) | Mobile (7), Next stage connection (7) |
| Fast Diagnostic | 8.6 | Bespoke (9), Hard to game (9), Emotional (9) | Placeholder fallback (7) |
| Constitutional Diagnostic | 8.6 | Bespoke (9), Hard to game (9), WHY (9), Connected (9) | Mobile (7) |
| Team Assessment | 8.7 | WHY (10), Bespoke (9), Emotional (9), Hard to game (9) | Mobile (6) |
| Enterprise Assessment | 8.6 | WHY (10), Bespoke (9), Connected (9) | Mobile (7) |
| Executive Reporting | 8.5 | Bespoke (10), WHY (10) | Resume on intake (5), Mobile (6) |

**System Average: 8.5/10**

---

## Weakest Link in the Assessment Chain

### Primary: Mobile Usability (System-Wide)

The dual-axis input pattern (resonance + certainty sliders) is the architectural strength of the system but also its mobile liability. Team Assessment requires 24 dual-axis inputs across two phases. On a mobile device, this is genuinely fatiguing. The Fast Diagnostic (text-only) is the most mobile-friendly; the deeper instruments degrade progressively.

**Specific concern:** Team Assessment on mobile scores 6/10 -- the lowest individual score in the entire audit. A user who completes the Fast Diagnostic on mobile and is routed to the ladder will encounter progressively heavier input demands without any mobile-specific adaptation.

### Secondary: Executive Reporting Intake Resume (Score: 5/10)

The run page (`executive-reporting/run.tsx`) has an extensive intake form (15+ fields including structured selects and free-text). There is no visible resume/save mechanism for this intake. A user who pays, starts the intake, and loses connection or navigates away would need to re-enter everything. This is the single lowest score in the audit.

### Tertiary: Visual Discontinuity Between Purpose Alignment and the Ladder

Purpose Alignment uses a light cream/white theme with rounded 32px cards. Every other assessment uses dark institutional monumentalism (near-black backgrounds, gold accents, angular geometry). A user flowing from Purpose Alignment into Constitutional Diagnostic experiences a jarring visual shift. This does not break function but it damages the feeling of a single governed system.

### Quaternary: Fast Diagnostic Fallback Copy

When the server-generated `anchorNarrative` is null, the Fast Diagnostic falls back to generic structural language. This is serviceable but noticeably less personal than the server-generated version. The gap is visible and slightly damages trust in the "governed analysis" positioning.

---

## Chain Integrity Assessment

The assessment chain flows:

```
Fast Diagnostic (pre-ladder, 2 min)
        |
        v
Purpose Alignment (parallel, personal)  -->  Constitutional Diagnostic (Layer 01)
                                                        |
                                                        v
                                                Team Assessment (Layer 02)
                                                        |
                                                        v
                                              Enterprise Assessment (Layer 03)
                                                        |
                                                        v
                                              Executive Reporting (Layer 04, paid)
                                                        |
                                                        v
                                                  Strategy Room
```

**Intelligence inheritance is strong.** Each assessment reads prior results from sessionStorage and adjusts its readings. The Constitutional Diagnostic produces a bridge bundle that carries through. The Team Assessment reads Purpose Alignment scores. Enterprise reads Team scores. Executive Reporting reads everything.

**The challenge engine is consistently deployed** across all six instruments. No assessment allows flat-lining or vague input without challenge.

**Resume works everywhere except Executive Reporting intake.** This is the one gap.

**Email capture is present in every assessment result.** The `ResultEmailCapture` component is used consistently.

**No assessment has a dead end.** Every result page routes forward with a narrative justification for the next step.

---

## Recommendations (Priority Order)

1. **Add resume/save to Executive Reporting intake form.** This is post-payment -- losing work here directly damages paid customer experience. Use the same versioned state pattern already deployed in all other assessments.

2. **Mobile adaptation for dual-axis inputs.** Consider a simplified mobile input mode (e.g., two taps instead of two sliders) for Team and Enterprise assessments when viewport < 640px. The current slider-heavy UX is the most likely dropout point on mobile.

3. **Unify Purpose Alignment visual language.** Either migrate it to dark institutional or create a documented "personal vs institutional" visual rationale. The current discontinuity reads as oversight, not design intention.

4. **Strengthen Fast Diagnostic fallback copy.** When `anchorNarrative` is null, the generic fallback should at minimum interpolate user inputs into the condition/pattern/WHY sections. The template for this already exists in the "How this was determined" section.
