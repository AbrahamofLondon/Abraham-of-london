# Premium Asset Specifications — AOL Monetisation Layer

Generated: 2026-04-21
Status: Production-ready specifications
Relationship: All assets feed Executive Reporting (flagship, £95)

---

## INFRASTRUCTURE PREREQUISITES

Before these assets go live, the following pricing engine changes are required:

1. **`BASE_PRICING.worksheet` is currently `0` (free)**. Must be updated to support paid worksheets (£19–£29) or each worksheet asset must be registered with curated metadata overriding category to `brief` (£29).

2. **Slug-based category inference** in `lib/assets/pdf-identity.ts` will auto-classify assets containing "canvas", "scorecard", "template" as `worksheet` (free). Each new asset needs an explicit entry in `CURATED_METADATA` with `access: "paid"` and the correct category.

3. **Pricing tier mapping** for these 10 assets:

| User Category | System Category | System Price | Required Price | Action |
|---|---|---|---|---|
| Worksheet / Simple Tool | worksheet | £0 | £19–£29 | Override to `brief` or fix base pricing |
| Framework | framework | £19 | £29–£49 | Override to `playbook` (£49) or adjust |
| Toolkit | toolkit | £129 | £49–£129 | Works for £129; need new tier for £49–£99 |

---

## ASSET 1: Decision Exposure Calculator

**Category**: Worksheet
**Price**: £29
**System mapping**: `brief` (until worksheet pricing fixed)
**Slug**: `decision-exposure-calculator`

### Use Case
When a leadership team is debating whether to delay a decision and needs to see the compounding cost of inaction in financial and structural terms.

### Input
- The decision under consideration
- Estimated weekly cost of delay (direct + indirect)
- Number of dependencies waiting on this decision
- Current escalation status (none / informal / formal)

### Process
1. Name the decision and its owner
2. Estimate direct financial exposure per week of delay
3. Map structural dependencies blocked by this decision (teams, projects, contracts)
4. Score reputational and political exposure (1–5)
5. Calculate composite exposure score: (financial x dependency count) + political multiplier
6. Compare against threshold: GREEN / AMBER / RED

### Output
A single-page exposure score with a clear recommendation: DECIDE NOW, ESCALATE, or DOCUMENT AND HOLD. Includes the financial figure, dependency count, and composite score.

### Positioning Line
"Shows the exact cost of not deciding — in pounds, dependencies, and political capital."

### Relationship to Flagship
Feeds directly into Executive Reporting Section 2 (Decision Velocity). The exposure score maps to the Decision Delay Index used in the flagship diagnostic.

### Product Page Copy

**Decision Exposure Calculator** — £29

Every delayed decision has a cost. This calculator makes it visible.

Input a pending decision. Walk through 6 structured steps. Get a composite exposure score that quantifies financial drain, structural blockage, and political risk of continued delay.

Output: a single-page decision brief with a clear directive — decide now, escalate, or hold with documented rationale.

Used as a feeder tool for Executive Reporting diagnostics. Built on the same governance logic that drives the £95 flagship assessment.

Usable in 15 minutes. No interpretation required.

---

## ASSET 2: Mandate Clarity Framework

**Category**: Framework
**Price**: £49
**System mapping**: `playbook`
**Slug**: `mandate-clarity-framework`

### Use Case
When authority is ambiguous — who owns this decision, who can escalate, who is accountable if it fails. Used before restructuring, during leadership transitions, or when governance has drifted.

### Input
- The decision domain (e.g., "hiring above L5", "budget reallocation >£50k")
- Current assumed owner
- Current escalation path (if any)
- Last time this mandate was formally reviewed

### Process
1. Define the decision domain in one sentence
2. Identify current assumed owner vs. documented owner
3. Map the escalation chain: who escalates to whom, under what conditions
4. Test for mandate gaps: undocumented authority, overlapping ownership, phantom accountability
5. Produce a Mandate Clarity Score (0–100)
6. Generate a corrective action list ranked by severity
7. Output a one-page mandate map

### Output
A Mandate Clarity Score with a visual authority map showing: decision owner, escalation chain, identified gaps, and corrective actions. One page, board-presentable.

### Positioning Line
"If nobody knows who owns the decision, nobody owns the outcome."

### Relationship to Flagship
Maps directly to Executive Reporting Section 4 (Governance Integrity). The Mandate Clarity Score feeds the Governance Health Index in the flagship.

### Product Page Copy

**Mandate Clarity Framework** — £49

Ambiguous authority is the most expensive failure mode in organisations. This framework eliminates it.

Define a decision domain. Map who owns it, who escalates it, and where the gaps are. Walk away with a Mandate Clarity Score and a one-page authority map you can present to a board.

Identifies phantom accountability, overlapping ownership, and undocumented escalation paths. Produces a corrective action list ranked by severity.

Feeds directly into Executive Reporting governance diagnostics. Same structural logic, isolated for tactical use.

Usable in 20 minutes. Output is board-grade.

---

## ASSET 3: Structural Failure Diagnostic Canvas

**Category**: Worksheet
**Price**: £19
**System mapping**: `brief` (override required)
**Slug**: `structural-failure-diagnostic-canvas`

### Use Case
When something has failed and leadership needs to categorise the failure mode quickly — was it people, process, structure, or governance? Used in post-mortems, restructuring assessments, and board reviews.

### Input
- The failure event (one sentence)
- Affected scope (team / department / organisation)
- Timeline of failure (when first noticed to when it became critical)

### Process
1. State the failure in one sentence
2. Classify into failure domain: PEOPLE / PROCESS / STRUCTURE / GOVERNANCE
3. For each domain, score contribution (0–5)
4. Identify the primary failure mode (highest scoring domain)
5. Map cascading effects across remaining domains

### Output
A single-page diagnostic canvas showing failure domain scores, primary failure mode identification, and cascade map. Visual, structured, no narrative required.

### Positioning Line
"Categorise any failure in under 15 minutes — without the politics."

### Relationship to Flagship
Feeds Executive Reporting Section 5 (Structural Risk Assessment). Failure mode categories align directly with the flagship's risk taxonomy.

### Product Page Copy

**Structural Failure Diagnostic Canvas** — £19

When something breaks, leadership needs categorisation before solutions.

Score a failure across four domains: people, process, structure, governance. Identify the primary failure mode. Map how it cascaded. One page. No narrative. No politics.

Used as pre-work for Executive Reporting structural risk assessments. Same failure taxonomy, isolated for rapid post-mortem use.

Completed in 10 minutes. Output is a structured diagnostic, not a discussion document.

---

## ASSET 4: Team Alignment Gap Map

**Category**: Worksheet
**Price**: £29
**System mapping**: `brief`
**Slug**: `team-alignment-gap-map`

### Use Case
When leadership believes the team is aligned but performance suggests otherwise. Visualises the gap between what leadership thinks the priorities are and what the team is actually executing on.

### Input
- Leadership's top 5 stated priorities (ranked)
- Team's top 5 actual work streams (ranked, from project data or interviews)
- Timeframe under review

### Process
1. List leadership's top 5 priorities in rank order
2. List team's top 5 actual work streams in rank order
3. Map alignment: direct match, partial overlap, or complete divergence for each pair
4. Calculate Alignment Score: (matched pairs x 20) — produces 0–100
5. Identify the largest single gap and its likely root cause
6. Produce a visual gap map (ranked pair comparison)

### Output
A one-page gap map showing leadership priorities vs team execution, an Alignment Score (0–100), and the single largest divergence with root cause hypothesis.

### Positioning Line
"The gap between what leadership says and what the team does is where strategy dies."

### Relationship to Flagship
Feeds Executive Reporting Section 3 (Team Coherence Index). The Alignment Score is a direct input to the flagship's coherence diagnostic.

### Product Page Copy

**Team Alignment Gap Map** — £29

Leadership sets priorities. Teams execute something else. This tool makes the gap visible.

Rank leadership's top 5 priorities against the team's top 5 actual work streams. Get an Alignment Score (0–100) and a visual gap map showing exactly where divergence occurs and why.

Direct feeder into Executive Reporting coherence diagnostics. Same scoring model, isolated for team-level use.

15 minutes to complete. Output tells you where strategy is dying.

---

## ASSET 5: Escalation Readiness Scorecard

**Category**: Worksheet
**Price**: £19
**System mapping**: `brief` (override required — slug contains "scorecard")
**Slug**: `escalation-readiness-scorecard`

### Use Case
When a leader is considering escalating an issue but isn't sure if they have enough evidence, the right framing, or legitimate grounds. This prevents premature escalation (political cost) and delayed escalation (structural cost).

### Input
- The issue to escalate
- Current resolution attempts (what's been tried)
- Evidence gathered so far
- Proposed escalation target (person/body)

### Process
1. State the issue in one sentence
2. List resolution attempts and their outcomes
3. Score evidence strength (1–5): documented, quantified, corroborated
4. Score political risk of escalation (1–5)
5. Score structural risk of NOT escalating (1–5)
6. Calculate Escalation Readiness Score: evidence + structural risk — political risk

### Output
A single-page scorecard with a clear directive: ESCALATE NOW, GATHER MORE EVIDENCE, or RESOLVE LOCALLY. Includes evidence quality assessment and risk balance.

### Positioning Line
"Escalate too early, you lose credibility. Too late, you lose the organisation."

### Relationship to Flagship
Feeds Executive Reporting Section 6 (Escalation Pattern Analysis). The readiness score calibrates the flagship's escalation health metric.

### Product Page Copy

**Escalation Readiness Scorecard** — £19

Escalation is a precision tool, not an emotional reaction. This scorecard determines if you're ready.

Score your evidence strength, political risk, and structural risk of inaction. Get a clear directive: escalate now, gather more, or resolve locally.

Prevents the two most expensive escalation failures: going too early (credibility loss) and going too late (structural damage).

Calibrates directly with Executive Reporting escalation diagnostics. 10 minutes. One decision.

---

## ASSET 6: Governance Drift Detector

**Category**: Framework
**Price**: £49
**System mapping**: `playbook`
**Slug**: `governance-drift-detector`

### Use Case
When the organisation's governance intent (what was designed) has diverged from governance execution (what actually happens). Used quarterly, during audits, or when decision quality visibly deteriorates.

### Input
- Governance framework document or stated governance principles (3–5)
- Actual decision-making behaviours observed (3–5 examples)
- Timeframe since last governance review

### Process
1. List stated governance principles (max 5)
2. For each principle, document the actual observed behaviour
3. Score drift per principle: 0 (aligned) to 5 (complete divergence)
4. Calculate Governance Drift Score: sum of all drift scores / (max possible x 100)
5. Classify: HEALTHY (<20%), DRIFTING (20–50%), BROKEN (>50%)
6. Map drift to root causes: neglect, complexity, personnel change, mandate erosion
7. Produce corrective priority list

### Output
A Governance Drift Score with per-principle breakdown, drift classification, root cause map, and corrective priority list. Two pages maximum.

### Positioning Line
"The distance between what governance was designed to do and what it actually does is measurable."

### Relationship to Flagship
Core feeder to Executive Reporting Section 4 (Governance Integrity). The Drift Score is the primary input to the flagship's governance health assessment.

### Product Page Copy

**Governance Drift Detector** — £49

Governance doesn't collapse. It drifts. This framework measures the distance.

List your stated governance principles. Document what actually happens. Get a Governance Drift Score, a per-principle breakdown, root cause classification, and a corrective priority list.

Classifies governance health as HEALTHY, DRIFTING, or BROKEN. No ambiguity.

Primary feeder into Executive Reporting governance diagnostics. The same scoring engine, available for standalone quarterly use.

20 minutes. Board-presentable output.

---

## ASSET 7: Strategic Priority Stack Builder

**Category**: Framework
**Price**: £49
**System mapping**: `playbook`
**Slug**: `strategic-priority-stack-builder`

### Use Case
When leadership has too many priorities and needs to force-rank them under real constraints — budget, time, political capital. Eliminates "everything is a priority" dysfunction.

### Input
- List of current priorities (5–15)
- Available budget (total)
- Available time horizon
- Political capital constraints (which stakeholders must be satisfied)

### Process
1. List all stated priorities
2. For each: estimate cost, time requirement, and stakeholder dependency
3. Apply constraint filter: remove any priority that exceeds budget or time horizon alone
4. Force-rank remaining priorities using weighted scoring: impact (40%), feasibility (30%), political alignment (30%)
5. Produce a Priority Stack: ranked list with cumulative resource consumption
6. Identify the "cut line" — where resources run out
7. Output: what's funded, what's deferred, what's killed

### Output
A Priority Stack showing ranked initiatives with cumulative resource draw, a clear cut line, and explicit FUND / DEFER / KILL classifications for each priority.

### Positioning Line
"If everything is a priority, nothing gets done. This forces the rank order."

### Relationship to Flagship
Feeds Executive Reporting Section 1 (Strategic Coherence). The Priority Stack output maps directly to the flagship's strategic alignment assessment.

### Product Page Copy

**Strategic Priority Stack Builder** — £49

"Everything is a priority" is the most common strategic failure mode. This framework kills it.

List your priorities. Apply real constraints — budget, time, political capital. Get a force-ranked Priority Stack with a clear cut line showing what's funded, what's deferred, and what's dead.

No consensus-building. No negotiation. Constraint-based ranking that produces a defensible output.

Feeds directly into Executive Reporting strategic coherence assessments. Same logic, isolated for planning sessions.

25 minutes. Output replaces the priority debate entirely.

---

## ASSET 8: Execution Risk Index

**Category**: Framework
**Price**: £29
**System mapping**: `playbook` (override — framework at £29 needs `brief` category in system)
**Slug**: `execution-risk-index`

### Use Case
Before committing resources to delivery — a project, initiative, or restructuring — this assesses how fragile the execution plan actually is. Prevents commitment to plans that will fail on contact with reality.

### Input
- The initiative or project name
- Key delivery milestones (3–7)
- Resource dependencies (people, budget, systems)
- Known risks already identified

### Process
1. Name the initiative and its success criteria
2. For each milestone: score delivery confidence (1–5)
3. For each resource dependency: score availability certainty (1–5)
4. Identify single points of failure (any dependency scored 1–2)
5. Calculate Execution Risk Index: (sum of confidence scores + availability scores) / max possible x 100
6. Classify: LOW RISK (>75%), MODERATE (50–75%), HIGH RISK (<50%)

### Output
An Execution Risk Index score with milestone-level confidence breakdown, dependency risk map, single points of failure flagged, and a risk classification. One page.

### Positioning Line
"Measures delivery fragility before you commit — not after you've spent the budget."

### Relationship to Flagship
Feeds Executive Reporting Section 7 (Execution Integrity). The Risk Index score is a direct input to the flagship's delivery confidence metric.

### Product Page Copy

**Execution Risk Index** — £29

Every initiative looks viable in the slide deck. This tool tests whether it survives contact with reality.

Score delivery confidence per milestone. Map resource dependencies and their certainty. Flag single points of failure. Get an Execution Risk Index that classifies your plan as LOW, MODERATE, or HIGH RISK.

One page. No narrative. A number and a classification.

Feeds into Executive Reporting execution integrity diagnostics. Same scoring framework, available pre-commitment.

15 minutes. Prevents the most expensive mistake in delivery: committing to a fragile plan.

---

## ASSET 9: Intervention Path Selector

**Category**: Toolkit
**Price**: £79
**System mapping**: `report` (£79 — closest system match)
**Slug**: `intervention-path-selector`

### Use Case
When something is broken and leadership needs to choose between fixing in place, restructuring, or escalating to a higher authority. This is the decision tool that routes the response.

### Input
- The problem statement
- Current severity (operational / strategic / existential)
- Resources available for intervention
- Time constraint
- Previous intervention attempts

### Process
1. Define the problem in one sentence
2. Classify severity: OPERATIONAL / STRATEGIC / EXISTENTIAL
3. Assess resource sufficiency for each intervention type:
   - FIX: Can current team resolve with current resources?
   - RESTRUCTURE: Does this require new authority, team composition, or process?
   - ESCALATE: Does this exceed current leadership's mandate?
4. Score each path on: feasibility (1–5), time fit (1–5), risk of failure (1–5)
5. Apply decision matrix: highest (feasibility + time fit) — risk = recommended path
6. Produce intervention brief: selected path, resource requirements, timeline, success criteria
7. Generate contingency: if primary path fails, what's the fallback?

### Output
A two-page intervention brief: recommended path (FIX / RESTRUCTURE / ESCALATE) with full rationale, resource requirements, timeline, success criteria, and contingency path. Board-presentable.

### Positioning Line
"Three paths. One recommendation. No ambiguity about what to do next."

### Relationship to Flagship
Core feeder to Executive Reporting Section 8 (Intervention Architecture). The path selection maps directly to the flagship's recommended action framework.

### Product Page Copy

**Intervention Path Selector** — £79

When something breaks, leadership faces three options: fix it, restructure around it, or escalate it. This toolkit selects the right one.

Define the problem. Classify severity. Score each intervention path on feasibility, time fit, and failure risk. Get a recommended path with full rationale, resource requirements, and a contingency if it fails.

Two-page board-ready output. Replaces the "what do we do now" meeting.

Core feeder into Executive Reporting intervention architecture. Same decision logic, available for immediate tactical use.

20 minutes. One clear directive.

---

## ASSET 10: Board Brief Template (Structured)

**Category**: Toolkit
**Price**: £129
**System mapping**: `toolkit`
**Slug**: `board-brief-template-structured`

### Use Case
When findings from any diagnostic, assessment, or governance review need to be communicated to a board. Converts analysis into board-grade structured narrative with the correct framing, severity, and recommended actions.

### Input
- Source findings (from any AOL diagnostic or external assessment)
- Severity classification
- Recommended actions (up to 5)
- Financial implications (if applicable)
- Timeline for action

### Process
1. Summarise findings in 3 sentences maximum (the "Board Statement")
2. Classify severity: INFORMATIONAL / REQUIRES ATTENTION / URGENT / CRITICAL
3. Map findings to governance domains affected
4. Structure recommended actions with: owner, deadline, resource requirement, success metric
5. Calculate financial exposure (if applicable)
6. Produce executive summary: one paragraph, board-grade language
7. Generate the complete Board Brief: 2–3 pages, structured sections, no filler

### Output
A 2–3 page Board Brief containing: Board Statement (3 sentences), Severity Classification, Governance Domain Impact, Structured Action Plan (owner/deadline/resource/metric per action), Financial Exposure Summary, and Executive Summary. Ready to present without modification.

### Positioning Line
"Turns any finding into a board-ready brief in 30 minutes — with the structure boards actually expect."

### Relationship to Flagship
The capstone tool. Takes output from Executive Reporting (or any other AOL asset) and converts it into board communication. Completes the chain from diagnostic to decision to board presentation.

### Product Page Copy

**Board Brief Template (Structured)** — £129

Boards don't read reports. They read structured briefs with clear severity, clear actions, and clear financial exposure.

This toolkit converts any diagnostic finding into a 2–3 page Board Brief with: a 3-sentence Board Statement, severity classification, governance domain mapping, structured action plan (owner, deadline, resources, metrics), and executive summary.

Board-grade language. Board-expected structure. Zero filler.

The capstone of the AOL asset system. Takes output from Executive Reporting and converts it into the format that drives board decisions.

30 minutes. Output requires no modification before presentation.

---

## PRICING SUMMARY

| # | Asset | Category | Price | System Category |
|---|-------|----------|-------|-----------------|
| 1 | Decision Exposure Calculator | Worksheet | £29 | brief |
| 2 | Mandate Clarity Framework | Framework | £49 | playbook |
| 3 | Structural Failure Diagnostic Canvas | Worksheet | £19 | brief (override) |
| 4 | Team Alignment Gap Map | Worksheet | £29 | brief |
| 5 | Escalation Readiness Scorecard | Worksheet | £19 | brief (override) |
| 6 | Governance Drift Detector | Framework | £49 | playbook |
| 7 | Strategic Priority Stack Builder | Framework | £49 | playbook |
| 8 | Execution Risk Index | Framework | £29 | brief (override) |
| 9 | Intervention Path Selector | Toolkit | £79 | report |
| 10 | Board Brief Template (Structured) | Toolkit | £129 | toolkit |

**Total portfolio value**: £479 (full set)
**Revenue per customer if all purchased**: £479
**Executive Reporting upsell path**: Every asset feeds the £95 flagship

---

## REQUIRED CODE CHANGES

### 1. Pricing Engine Update (`lib/commercial/pricing-engine.ts`)

```typescript
export const BASE_PRICING = {
  worksheet: 19,    // Changed from 0 — worksheets are now paid tools
  framework: 29,    // Adjusted to support £29 frameworks
  brief: 29,
  playbook: 49,
  report: 79,
  toolkit: 129,
} as const;
```

### 2. Curated Metadata Entries (`lib/assets/pdf-identity.ts`)

Each of the 10 assets needs an entry in `CURATED_METADATA` to override slug-based inference:

```typescript
"decision-exposure-calculator": {
  title: "Decision Exposure Calculator",
  category: "brief",
  access: "paid",
  description: "Quantifies financial and structural risk of decision delay.",
},
"mandate-clarity-framework": {
  title: "Mandate Clarity Framework",
  category: "playbook",
  access: "paid",
  description: "Defines authority, ownership, and escalation boundaries.",
},
// ... (all 10 assets)
```

### 3. Registry Entries

Each asset needs a PDF generated and registered in `pdf-registry.generated.ts` with:
- `exists: true`
- Correct `tier` matching access level
- MD5 checksum
- File size

---

## PRODUCT LINE ARCHITECTURE

```
Executive Reporting (£95) — FLAGSHIP
    |
    +-- Decision Tools (feed Sections 1-3)
    |   |-- Decision Exposure Calculator (£29)
    |   |-- Strategic Priority Stack Builder (£49)
    |   |-- Team Alignment Gap Map (£29)
    |
    +-- Governance Tools (feed Sections 4-6)
    |   |-- Mandate Clarity Framework (£49)
    |   |-- Governance Drift Detector (£49)
    |   |-- Escalation Readiness Scorecard (£19)
    |
    +-- Execution Tools (feed Sections 7-8)
    |   |-- Execution Risk Index (£29)
    |   |-- Structural Failure Diagnostic Canvas (£19)
    |   |-- Intervention Path Selector (£79)
    |
    +-- Board Communication (capstone)
        |-- Board Brief Template (£129)
```

Every asset is a standalone revenue line AND a feeder to the flagship.
