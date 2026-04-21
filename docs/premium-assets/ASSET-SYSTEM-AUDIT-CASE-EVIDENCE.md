# Asset System Audit + Case Evidence Layer

Generated: 2026-04-21
Status: Release blocked until leakage and missing binaries are closed.

## Full Asset Audit Table

| Asset / surface | Category | exists | accessible | gated | leaking | quality: clarity / impact / unique / integration | verdict | required fix |
|---|---:|---:|---:|---:|---:|---|---|---|
| decision-exposure-calculator | worksheet | false | false | false | false | 8 / 9 / 7 / 9 | not_sellable | Generate canonical binary; register in PDF identity/registry; deliver only via entitlement-gated API. |
| mandate-clarity-framework | framework | false | false | false | false | 9 / 9 / 8 / 9 | not_sellable | Generate canonical binary; register in PDF identity/registry; deliver only via entitlement-gated API. |
| structural-failure-diagnostic-canvas | worksheet | false | false | false | false | 8 / 8 / 7 / 9 | not_sellable | Generate canonical binary; register in PDF identity/registry; deliver only via entitlement-gated API. |
| team-alignment-gap-map | worksheet | false | false | false | false | 8 / 9 / 7 / 9 | not_sellable | Generate canonical binary; register in PDF identity/registry; deliver only via entitlement-gated API. |
| escalation-readiness-scorecard | worksheet | false | false | false | false | 9 / 8 / 7 / 9 | not_sellable | Generate canonical binary; register in PDF identity/registry; deliver only via entitlement-gated API. |
| governance-drift-detector | framework | false | false | false | false | 9 / 9 / 8 / 10 | not_sellable | Generate canonical binary; register in PDF identity/registry; deliver only via entitlement-gated API. |
| strategic-priority-stack-builder | framework | false | false | false | false | 9 / 10 / 8 / 10 | not_sellable | Generate canonical binary; register in PDF identity/registry; deliver only via entitlement-gated API. |
| execution-risk-index | framework | false | false | false | false | 8 / 9 / 7 / 9 | not_sellable | Generate canonical binary; register in PDF identity/registry; deliver only via entitlement-gated API. |
| intervention-path-selector | toolkit | false | false | false | false | 9 / 10 / 8 / 10 | not_sellable | Generate canonical binary; register in PDF identity/registry; deliver only via entitlement-gated API. |
| board-brief-template-structured | toolkit | false | false | false | false | 9 / 9 / 7 / 10 | not_sellable | Generate canonical binary; register in PDF identity/registry; deliver only via entitlement-gated API. |
| global-market-outlook-q1-2026-public | brief | true | true | false | false | 8 / 7 / 7 / 7 | fair | Keep public, but sharpen the tension toward the institutional paid report. |
| global-market-intelligence-report-q1-2026 | report | true | true | intended | true | 8 / 8 / 7 / 8 | fair after gating | Move paid binary out of `public/assets/downloads`; direct URL currently bypasses entitlement. |
| global-market-intelligence-board-deck-q1-2026 | report | true | true | intended | true | 7 / 8 / 7 / 8 | fair after gating | Same: move paid binary out of static public path and serve only with token/entitlement. |
| /artifacts detail pages | brief | true | true | partial | partial | 7 / 7 / 7 / 7 | fair after CTA fix | Do not render direct download links that require tokens without first issuing a token. |
| /assets/downloads corpus | mixed | true | true | false | true | mixed | not_sellable for paid use | 428 canonical static PDFs are publicly addressable; paid/private binaries cannot live here. |
| Vault / Inner Circle PDFs | mixed | true | true | partial | true | mixed | fair for public, not_sellable for private | Public `/vault/**.pdf` and duplicate `/assets/downloads/**.pdf` paths must be treated as leaked if any item is private. |

## Market Intelligence Brief Evaluation + Pricing

Free version: valuable, not merely a teaser. It gives a coherent public thesis: structural pressure, capital selectivity, policy credibility, and resilience premium.

Free version weakness: it currently gives too much complete interpretation without enough unresolved decision tension. It should hold back decision windows, exposure analysis, and action sequencing.

Paid report: credible and decision-grade, but currently too descriptive in places. It needs explicit sections:

- Market Position Mapping: who is structurally winning/losing.
- Exposure Analysis: where risk accumulates by geography, supply chain, rates, FX, and demand.
- Decision Windows: what must be reviewed within 30 / 60 / 90 days.
- Actionable Moves: board-level moves now.
- Implication if ignored: consequence framing by operating model.

Pricing:

- Public edition: free gateway.
- Institutional report: £79 current price is fair; £95 is defensible only after adding decision windows and exposure tables.
- Board deck: £129 is fair if it is presentation-ready and not just a compressed report.

## Rewritten Structure For The 10 Assets

### 1. Decision Exposure Instrument

Context: Used when a delayed decision is creating cost, dependency blockage, or political exposure.
Decision Frame: DECIDE NOW / ESCALATE / DOCUMENT AND HOLD.
Input: decision statement; named owner; weekly direct and indirect cost; blocked dependencies; escalation status.
Process: name decision and owner; calculate weekly exposure; count dependencies; score political exposure; classify GREEN / AMBER / RED.
Output: classification; decision implication; next action; exposure figure.
Failure Signal: If cost or owner cannot be named, the problem is governance ambiguity.

### 2. Mandate Clarity Framework

Context: Used when nobody can state who owns a decision, escalation, or consequence.
Decision Frame: CONFIRM OWNER / REASSIGN MANDATE / ESCALATE AUTHORITY.
Input: decision domain; assumed owner; documented owner; escalation path; last mandate review date.
Process: define domain; compare owner states; map escalation authority; identify phantom accountability; score clarity.
Output: classification; decision implication; next action; authority map.
Failure Signal: If ownership cannot be documented, the organisation is operating on social permission.

### 3. Structural Failure Diagnostic Canvas

Context: Used immediately after a material failure before blame narratives harden.
Decision Frame: PEOPLE / PROCESS / STRUCTURE / GOVERNANCE.
Input: failure event; affected scope; timeline; preceding decisions.
Process: state failure; score four domains; identify highest domain; map cascade; assign corrective owner.
Output: classification; decision implication; next action; cascade map.
Failure Signal: If the team cannot agree on the failure sentence, the failure is still politically contested.

### 4. Team Alignment Gap Map

Context: Used when leadership believes priorities are clear but execution indicates otherwise.
Decision Frame: ALIGN / RESEQUENCE / STOP MISDIRECTED WORK.
Input: leadership top five priorities; team top five work streams; timeframe; evidence source.
Process: rank leadership priorities; rank actual work; mark alignment; calculate score; name largest divergence.
Output: classification; decision implication; next action; alignment score.
Failure Signal: If actual work streams cannot be named, the team is not managed through observable priorities.

### 5. Escalation Readiness Scorecard

Context: Used before escalating a sensitive issue to prevent premature or delayed escalation.
Decision Frame: ESCALATE NOW / GATHER EVIDENCE / RESOLVE LOCALLY.
Input: issue; prior attempts; evidence; escalation target; cost of non-escalation.
Process: state issue; list attempts; score evidence; score political risk; compare structural risk.
Output: classification; decision implication; next action; evidence gap.
Failure Signal: If evidence cannot be shown, escalation is emotion rather than governance.

### 6. Governance Drift Detector

Context: Used quarterly or when governance intent no longer matches actual behaviour.
Decision Frame: MAINTAIN / CORRECT / REBUILD GOVERNANCE.
Input: governance principles; observed behaviours; timeframe; mandate changes.
Process: list principles; document behaviour; score drift; classify root cause; set corrective priority.
Output: classification; decision implication; next action; drift score.
Failure Signal: If stated principles cannot be produced, governance is habit rather than design.

### 7. Strategic Priority Stack Builder

Context: Used when the organisation has more priorities than resources.
Decision Frame: FUND / DEFER / KILL.
Input: priorities; budget; time horizon; stakeholder constraints.
Process: list priorities; attach cost/time/dependency; remove impossible items; score remaining items; draw cut line.
Output: classification; decision implication; next action; ranked priority stack.
Failure Signal: If leaders refuse a cut line, the issue is avoidance of trade-offs.

### 8. Execution Risk Index

Context: Used before committing resources to an initiative.
Decision Frame: COMMIT / REPAIR PLAN / STOP.
Input: initiative; success criteria; milestones; dependencies; known risks.
Process: define success; score milestone confidence; score dependency certainty; flag single points of failure; classify risk.
Output: classification; decision implication; next action; single points of failure.
Failure Signal: If dependency certainty cannot be scored, the plan is not yet executable.

### 9. Intervention Path Selector

Context: Used when leadership must choose between fixing, restructuring, or escalating.
Decision Frame: FIX / RESTRUCTURE / ESCALATE.
Input: problem; severity; resources; time constraint; previous attempts.
Process: classify severity; score fix; score restructure; score escalation legitimacy; select primary and fallback path.
Output: classification; decision implication; next action; intervention brief.
Failure Signal: If no path is feasible, the condition has exceeded the current authority system.

### 10. Board Brief Template (Structured)

Context: Used when diagnostic findings must become a board-ready decision brief.
Decision Frame: INFORM / SEEK DECISION / REQUEST AUTHORITY.
Input: findings; severity; actions; financial implications; timeline.
Process: write three-sentence board statement; classify severity; map governance domains; assign owner/deadline/resource/metric; state board decision.
Output: classification; decision implication; next action; board-ready brief.
Failure Signal: If the board decision cannot be stated, the brief is informational noise.

## Leakage Report

Critical:

- `/assets/downloads/global-market-intelligence-report-q1-2026.pdf` is directly addressable.
- `/assets/downloads/global-market-intelligence-board-deck-q1-2026.pdf` is directly addressable.
- Paid asset delivery through `/api/downloads/[slug]` is gated, but static `public` delivery bypasses that route.
- `/artifacts/[id]` renders a direct download link to token-required premium endpoints; without token issue flow this dead-ends.
- Registry reports show 428 canonical PDFs in `/assets/downloads` and 751 total PDFs across public asset surfaces.

Required release rule:

Paid or member-only binaries must not live under `public`. Store them outside static serving and stream through entitlement-gated/token-gated APIs only.

## Pricing Validation Verdict

| Asset type | Valid range | Current verdict |
|---|---:|---|
| Worksheet | £19-£29 | Valid if each produces a decision classification. |
| Framework | £29-£49 | Valid for reusable decision instruments. |
| Toolkit | £79-£129 | Valid for multi-step and board-portable use. |
| Brief | £29-£49 | Valid only when insight ends in action. |
| Report | £49-£95 | Valid for decision-grade intelligence; GMI can support £79 now, £95 after decision-window upgrade. |

Portfolio verdict: pricing is strategically valid; release readiness is not. Weakness is not price. Weakness is missing binaries and static leakage.

## Case Evidence Drafts

### Case 1 — Escalation Without Evidence

Situation: Founder wanted to escalate a senior operator conflict to the board.
System diagnosis: Evidence was anecdotal; structural risk was real but politically exposed.
Decision taken: Escalation delayed for seven days while evidence was converted into an escalation packet.
Outcome: improved.
Timeframe: 14 days.

Observed outcome phrasing: The system prevented a weak escalation and produced a cleaner authority route.

### Case 2 — Priority Stack Collapse

Situation: Leadership held 11 active priorities with enough capacity for four.
System diagnosis: Strategic priority stack was incoherent; execution risk was being hidden by activity.
Decision taken: Seven priorities were deferred or killed; the remaining four were assigned owners and cut-line logic.
Outcome: resolved.
Timeframe: 21 days.

Observed outcome phrasing: The organisation did not need more motivation. It needed fewer sanctioned priorities.

### Case 3 — Governance Drift Under Growth

Situation: A scaling team kept bypassing its stated approval process to keep velocity high.
System diagnosis: Governance drift was being misread as agility.
Decision taken: Approval thresholds were rewritten and exception authority was moved to a named owner.
Outcome: improved.
Timeframe: 30 days.

Observed outcome phrasing: Speed was preserved only after the authority path became explicit.

### Case 4 — Fragile Execution Commitment

Situation: A delivery plan was about to receive budget approval despite unresolved resource dependencies.
System diagnosis: Execution risk was high; two dependencies were single points of failure.
Decision taken: Commitment was paused; dependency certainty became a funding condition.
Outcome: stable.
Timeframe: 28 days.

Observed outcome phrasing: The system prevented premature commitment but did not yet produce improvement.

### Case 5 — Ignored Alignment Gap

Situation: Leadership believed the team was aligned around a new commercial push.
System diagnosis: Team work streams showed only partial alignment with stated priorities.
Decision taken: No correction was made; the finding was treated as communication noise.
Outcome: deteriorated.
Timeframe: 45 days.

Observed outcome phrasing: The ignored gap became an execution failure, not a messaging issue.
