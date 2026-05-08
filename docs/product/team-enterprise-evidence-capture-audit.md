# Team + Enterprise Evidence Capture Audit

## Scope

Surfaces audited:

- `pages/diagnostics/team-assessment.tsx`
- `pages/diagnostics/enterprise-assessment.tsx`

Verdict standard:

- `PROTECT_AS_IS`
- `KEEP_BUT_REPOSITION`
- `REWRITE_FOR_EVIDENCE`
- `ADD_FOLLOWUP_ONLY`
- `REMOVE`

Evidence category matrix:

- `CONDITION_READING`
- `AUTHORITY_SIGNAL`
- `DIVERGENCE_SIGNAL`
- `CONSEQUENCE_SIGNAL`
- `PRIOR_ATTEMPT`
- `FAILURE_CAUSE`
- `RECURRENCE_SIGNAL`
- `VERIFICATION_PROOF`
- `ESCALATION_SIGNAL`
- `DECISION_REQUIRED`
- `STOP_SIGNAL`

## Executive Verdict

The Team Assessment is already a premium divergence instrument. Its question set should remain largely intact. The missing layer was not better diagnosis. The missing layer was governed evidence history after diagnosis.

The Enterprise Assessment already has the correct tone and the correct pressure themes. Its weakness was also not diagnostic sharpness. It was failure to capture institutional memory, verification proof, and dependency logic after the reading was complete.

This pass therefore protects the current scoring instruments and adds a post-score evidence bridge instead of rewriting the core assessment blocks.

## High-Yield Questions Already Working

### Team Assessment

- Leader vs estimated-team pairings across `Direction & Priority`, `Trust & Communication`, and `Authority & Escalation` are already high-yield because they generate `DIVERGENCE_SIGNAL`, not just sentiment.
- Questions on surfaced tensions, conflicting priorities, and correct escalation level are product assets and should remain sharp.

### Enterprise Assessment

- Surfaced vs buried disagreement, trustworthy operational signals, cost of delay, political resistance, and institutional correction friction are already premium signals.
- The recent decision field already grounds the reading in a real decision context, which materially strengthens downstream use.

## Missing Evidence Categories

Not captured anywhere in the current Team or Enterprise scoring instruments before this upgrade:

- `PRIOR_ATTEMPT`
- `FAILURE_CAUSE`
- `RECURRENCE_SIGNAL`
- `VERIFICATION_PROOF`
- `STOP_SIGNAL` in Team
- `DECISION_REQUIRED` as explicit dependency logic in Enterprise

Only partially captured before this upgrade:

- `ESCALATION_SIGNAL`
- `CONSEQUENCE_SIGNAL`
- `AUTHORITY_SIGNAL`

## Team Assessment Audit

| Question ID | Current text | Surface | Input type | Scoring dependency | Evidence categories | Evidence produced | Downstream consumer | Evidence gap | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `leader_direction_0` | `[Leader] From my position, the team can state the current priority set with genuine consistency.` | Team Assessment | Dual-axis -> 1-5 | Direction domain, overall leader score, gap engine | `CONDITION_READING`, `DIVERGENCE_SIGNAL` | Claimed priority coherence from leadership view | Enterprise Assessment, Executive Reporting, Control Room | No attempt history, recurrence, verification proof | `PROTECT_AS_IS` |
| `reality_direction_0` | `[Reality] Team members would say they can state the current priority set with genuine consistency.` | Team Assessment | Dual-axis -> 1-5 | Direction domain, overall reality score, gap engine | `CONDITION_READING`, `DIVERGENCE_SIGNAL` | Estimated operating reality on priority coherence | Enterprise Assessment, Executive Reporting, Control Room | No attempt history, recurrence, verification proof | `PROTECT_AS_IS` |
| `leader_direction_1` | `[Leader] From my position, the team organises day-to-day work around declared priorities rather than noise.` | Team Assessment | Dual-axis -> 1-5 | Direction domain, overall leader score, gap engine | `CONDITION_READING`, `DIVERGENCE_SIGNAL`, `CONSEQUENCE_SIGNAL` | Claimed priority translation into work | Executive Reporting, Strategy Room | No prior-correction evidence, no proof threshold | `PROTECT_AS_IS` |
| `reality_direction_1` | `[Reality] Team members would say they organise day-to-day work around declared priorities rather than noise.` | Team Assessment | Dual-axis -> 1-5 | Direction domain, overall reality score, gap engine | `CONDITION_READING`, `DIVERGENCE_SIGNAL`, `CONSEQUENCE_SIGNAL` | Estimated execution reality against stated priorities | Executive Reporting, Strategy Room | No prior-correction evidence, no proof threshold | `PROTECT_AS_IS` |
| `leader_direction_2` | `[Leader] From my position, the team is not carrying conflicting versions of what success looks like.` | Team Assessment | Dual-axis -> 1-5 | Direction domain, overall leader score, gap engine | `CONDITION_READING`, `DIVERGENCE_SIGNAL` | Claimed success-definition coherence | Enterprise Assessment, Boardroom Mode | No recurrence or stop signal | `PROTECT_AS_IS` |
| `reality_direction_2` | `[Reality] Team members would say they are not carrying conflicting versions of what success looks like.` | Team Assessment | Dual-axis -> 1-5 | Direction domain, overall reality score, gap engine | `CONDITION_READING`, `DIVERGENCE_SIGNAL` | Estimated operating disagreement over success definition | Enterprise Assessment, Boardroom Mode | No recurrence or stop signal | `PROTECT_AS_IS` |
| `leader_execution_0` | `[Leader] From my position, the team moves work with clear ownership rather than diffusion of accountability.` | Team Assessment | Dual-axis -> 1-5 | Execution domain, leader score, gap engine | `CONDITION_READING`, `AUTHORITY_SIGNAL`, `DIVERGENCE_SIGNAL` | Claimed ownership clarity | Executive Reporting, Oversight Brief, Strategy Room | No failed-correction history | `PROTECT_AS_IS` |
| `reality_execution_0` | `[Reality] Team members would say they move work with clear ownership rather than diffusion of accountability.` | Team Assessment | Dual-axis -> 1-5 | Execution domain, reality score, gap engine | `CONDITION_READING`, `AUTHORITY_SIGNAL`, `DIVERGENCE_SIGNAL` | Estimated operating ownership clarity | Executive Reporting, Oversight Brief, Strategy Room | No failed-correction history | `PROTECT_AS_IS` |
| `leader_execution_1` | `[Leader] From my position, the team converts meetings and decisions into measurable action.` | Team Assessment | Dual-axis -> 1-5 | Execution domain, leader score, gap engine | `CONDITION_READING`, `CONSEQUENCE_SIGNAL` | Claimed conversion of decision into action | Return Brief, Control Room | No proof of what would count as improvement | `PROTECT_AS_IS` |
| `reality_execution_1` | `[Reality] Team members would say they convert meetings and decisions into measurable action.` | Team Assessment | Dual-axis -> 1-5 | Execution domain, reality score, gap engine | `CONDITION_READING`, `CONSEQUENCE_SIGNAL` | Estimated operating conversion quality | Return Brief, Control Room | No proof of what would count as improvement | `PROTECT_AS_IS` |
| `leader_execution_2` | `[Leader] From my position, the team produces visible progress, not just activity.` | Team Assessment | Dual-axis -> 1-5 | Execution domain, leader score, gap engine | `CONDITION_READING`, `CONSEQUENCE_SIGNAL` | Broad throughput claim | Executive Reporting, Return Brief | Sounds strong but evidence is generic and non-specific | `KEEP_BUT_REPOSITION` |
| `reality_execution_2` | `[Reality] Team members would say they produce visible progress, not just activity.` | Team Assessment | Dual-axis -> 1-5 | Execution domain, reality score, gap engine | `CONDITION_READING`, `CONSEQUENCE_SIGNAL` | Broad operating progress claim | Executive Reporting, Return Brief | Sounds strong but evidence is generic and non-specific | `KEEP_BUT_REPOSITION` |
| `leader_trust_0` | `[Leader] From my position, the team surfaces important tensions without avoidance or political calculation.` | Team Assessment | Dual-axis -> 1-5 | Trust domain, leader score, gap engine | `CONDITION_READING`, `DIVERGENCE_SIGNAL`, `ESCALATION_SIGNAL` | Claimed candour under tension | Enterprise Assessment, Strategy Room, Oversight Brief | No attempt history, no stall-layer evidence | `PROTECT_AS_IS` |
| `reality_trust_0` | `[Reality] Team members would say they surface important tensions without avoidance or political calculation.` | Team Assessment | Dual-axis -> 1-5 | Trust domain, reality score, gap engine | `CONDITION_READING`, `DIVERGENCE_SIGNAL`, `ESCALATION_SIGNAL` | Estimated operating candour under tension | Enterprise Assessment, Strategy Room, Oversight Brief | No attempt history, no stall-layer evidence | `PROTECT_AS_IS` |
| `leader_trust_1` | `[Leader] From my position, the team communicates in ways that reduce ambiguity rather than multiply it.` | Team Assessment | Dual-axis -> 1-5 | Trust domain, leader score, gap engine | `CONDITION_READING`, `AUTHORITY_SIGNAL`, `DIVERGENCE_SIGNAL` | Claimed communication clarity | Executive Reporting, Control Room | No recurrence or verification proof | `PROTECT_AS_IS` |
| `reality_trust_1` | `[Reality] Team members would say they communicate in ways that reduce ambiguity rather than multiply it.` | Team Assessment | Dual-axis -> 1-5 | Trust domain, reality score, gap engine | `CONDITION_READING`, `AUTHORITY_SIGNAL`, `DIVERGENCE_SIGNAL` | Estimated communication clarity on the floor | Executive Reporting, Control Room | No recurrence or verification proof | `PROTECT_AS_IS` |
| `leader_trust_2` | `[Leader] From my position, the team maintains trust strong enough that correction can happen without paralysis.` | Team Assessment | Dual-axis -> 1-5 | Trust domain, leader score, gap engine | `CONDITION_READING`, `CONSEQUENCE_SIGNAL`, `ESCALATION_SIGNAL` | Claimed correction capacity | Oversight Brief, Strategy Room | No explanation of why prior correction failed | `PROTECT_AS_IS` |
| `reality_trust_2` | `[Reality] Team members would say they maintain trust strong enough that correction can happen without paralysis.` | Team Assessment | Dual-axis -> 1-5 | Trust domain, reality score, gap engine | `CONDITION_READING`, `CONSEQUENCE_SIGNAL`, `ESCALATION_SIGNAL` | Estimated correction capacity at operating layer | Oversight Brief, Strategy Room | No explanation of why prior correction failed | `PROTECT_AS_IS` |
| `leader_authority_0` | `[Leader] From my position, the team operates with decision rights clear enough to reduce unnecessary drag.` | Team Assessment | Dual-axis -> 1-5 | Authority domain, leader score, gap engine | `AUTHORITY_SIGNAL`, `CONDITION_READING`, `CONSEQUENCE_SIGNAL` | Claimed decision-right clarity | Executive Reporting, Strategy Room, Boardroom Mode | No dependency map, no stop signal | `PROTECT_AS_IS` |
| `reality_authority_0` | `[Reality] Team members would say they operate with decision rights clear enough to reduce unnecessary drag.` | Team Assessment | Dual-axis -> 1-5 | Authority domain, reality score, gap engine | `AUTHORITY_SIGNAL`, `CONDITION_READING`, `CONSEQUENCE_SIGNAL` | Estimated decision-right clarity in practice | Executive Reporting, Strategy Room, Boardroom Mode | No dependency map, no stop signal | `PROTECT_AS_IS` |
| `leader_authority_1` | `[Leader] From my position, the team escalates at the correct level and correct speed.` | Team Assessment | Dual-axis -> 1-5 | Authority domain, leader score, gap engine | `AUTHORITY_SIGNAL`, `ESCALATION_SIGNAL`, `CONDITION_READING` | Claimed escalation discipline | Oversight Brief, Retainer Oversight, Strategy Room | No evidence of where escalation currently stalls | `PROTECT_AS_IS` |
| `reality_authority_1` | `[Reality] Team members would say they escalate at the correct level and correct speed.` | Team Assessment | Dual-axis -> 1-5 | Authority domain, reality score, gap engine | `AUTHORITY_SIGNAL`, `ESCALATION_SIGNAL`, `CONDITION_READING` | Estimated escalation discipline in practice | Oversight Brief, Retainer Oversight, Strategy Room | No evidence of where escalation currently stalls | `PROTECT_AS_IS` |
| `leader_authority_2` | `[Leader] From my position, the team receives leadership intervention that helps them move rather than making them dependent.` | Team Assessment | Dual-axis -> 1-5 | Authority domain, leader score, gap engine | `AUTHORITY_SIGNAL`, `CONSEQUENCE_SIGNAL`, `DIVERGENCE_SIGNAL` | Claimed quality of intervention | Executive Reporting, Return Brief | No evidence of failed interventions or required stop actions | `PROTECT_AS_IS` |
| `reality_authority_2` | `[Reality] Team members would say they receive leadership intervention that helps them move rather than making them dependent.` | Team Assessment | Dual-axis -> 1-5 | Authority domain, reality score, gap engine | `AUTHORITY_SIGNAL`, `CONSEQUENCE_SIGNAL`, `DIVERGENCE_SIGNAL` | Estimated dependency effect of intervention | Executive Reporting, Return Brief | No evidence of failed interventions or required stop actions | `PROTECT_AS_IS` |

### Team Assessment Summary

- Already high-yield: all `Direction`, `Trust`, and `Authority` pairs, plus `Execution` questions on ownership and action conversion.
- Diagnostic-only: nearly the whole instrument. It measures condition and contradiction well, but not correction history.
- Downstream evidence already produced: divergence, authority ambiguity, execution drag, trust breakdown.
- Strong-sounding but weak-evidence items: the `visible progress, not just activity` pair is useful for scoring texture but weak as governance evidence unless paired with verification criteria.
- Missing categories before this upgrade: `PRIOR_ATTEMPT`, `FAILURE_CAUSE`, `RECURRENCE_SIGNAL`, `VERIFICATION_PROOF`, `STOP_SIGNAL`.

## Enterprise Assessment Audit

| Question ID | Current text | Surface | Input type | Scoring dependency | Evidence categories | Evidence produced | Downstream consumer | Evidence gap | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `leadership-0` | `Senior leadership reads the condition of the institution with enough consistency.` | Enterprise Assessment | Dual-axis -> 1-5 | Leadership block, total pct, route | `CONDITION_READING`, `AUTHORITY_SIGNAL` | Leadership coherence signal | Executive Reporting, Boardroom Mode | No history of failed institutional reading corrections | `PROTECT_AS_IS` |
| `leadership-1` | `Critical leadership disagreements are surfaced rather than buried.` | Enterprise Assessment | Dual-axis -> 1-5 | Leadership block, total pct, route | `DIVERGENCE_SIGNAL`, `AUTHORITY_SIGNAL`, `ESCALATION_SIGNAL` | Surfaced-vs-buried disagreement signal | Executive Reporting, Strategy Room, Oversight Brief | No evidence of where disagreement repeatedly gets buried | `PROTECT_AS_IS` |
| `leadership-2` | `Strategic messaging remains coherent as it moves through the enterprise.` | Enterprise Assessment | Dual-axis -> 1-5 | Leadership block, total pct, route | `CONDITION_READING`, `DIVERGENCE_SIGNAL` | Signal transmission coherence | Executive Reporting, Control Room | No recurrence trail or proof threshold | `PROTECT_AS_IS` |
| `governance-0` | `Decision rights are clear enough to reduce drag and duplication.` | Enterprise Assessment | Dual-axis -> 1-5 | Governance block, total pct, route | `AUTHORITY_SIGNAL`, `CONSEQUENCE_SIGNAL` | Enterprise decision-right clarity | Executive Reporting, Boardroom Mode, Strategy Room | No dependency map for blocked decisions | `PROTECT_AS_IS` |
| `governance-1` | `Escalation and accountability are operating at the correct level.` | Enterprise Assessment | Dual-axis -> 1-5 | Governance block, total pct, route | `AUTHORITY_SIGNAL`, `ESCALATION_SIGNAL` | High-level governance discipline signal | Oversight Brief, Retainer Oversight | Conflates escalation and accountability; weak as stand-alone governance proof | `KEEP_BUT_REPOSITION` |
| `governance-2` | `Governance structures are supporting execution rather than slowing it.` | Enterprise Assessment | Dual-axis -> 1-5 | Governance block, total pct, route | `CONDITION_READING`, `CONSEQUENCE_SIGNAL` | Governance friction signal | Executive Reporting, Strategy Room | No record of prior governance fixes and why they stalled | `PROTECT_AS_IS` |
| `execution-0` | `Performance varies within acceptable bounds rather than by dangerous extremes.` | Enterprise Assessment | Dual-axis -> 1-5 | Execution block, total pct, route | `CONDITION_READING`, `CONSEQUENCE_SIGNAL` | Enterprise execution variance signal | Executive Reporting, Control Room | No recurrence record across business cycles | `PROTECT_AS_IS` |
| `execution-1` | `Teams are not operating with materially different interpretations of priority.` | Enterprise Assessment | Dual-axis -> 1-5 | Execution block, total pct, route | `DIVERGENCE_SIGNAL`, `CONDITION_READING` | Cross-team priority divergence signal | Executive Reporting, Boardroom Mode | No record of prior alignment attempts | `PROTECT_AS_IS` |
| `execution-2` | `Operational signals are trustworthy enough for leadership to act on them.` | Enterprise Assessment | Dual-axis -> 1-5 | Execution block, total pct, route | `AUTHORITY_SIGNAL`, `CONDITION_READING`, `CONSEQUENCE_SIGNAL` | Signal trustworthiness | Executive Reporting, Strategy Room, Control Room | No evidence of how signal repair previously failed | `PROTECT_AS_IS` |
| `risk-0` | `Current delay does not materially increase strategic cost.` | Enterprise Assessment | Dual-axis -> 1-5 | Risk block, total pct, route | `CONSEQUENCE_SIGNAL`, `DECISION_REQUIRED` | Cost-of-delay signal | Executive Reporting, Return Brief | No explicit dependency or escalation threshold | `PROTECT_AS_IS` |
| `risk-1` | `Trust in the institution is not quietly weakening.` | Enterprise Assessment | Dual-axis -> 1-5 | Risk block, total pct, route | `CONSEQUENCE_SIGNAL`, `CONDITION_READING` | Institutional trust degradation signal | Executive Reporting, Oversight Brief | No recurrence proof or verification standard | `PROTECT_AS_IS` |
| `risk-2` | `Corrective action can still be taken without disproportionate political resistance.` | Enterprise Assessment | Dual-axis -> 1-5 | Risk block, total pct, route | `CONSEQUENCE_SIGNAL`, `ESCALATION_SIGNAL`, `AUTHORITY_SIGNAL` | Political resistance threshold | Executive Reporting, Strategy Room, Boardroom Mode | No explicit escalation readiness history | `PROTECT_AS_IS` |
| `recentDecision` | `Recent high-stakes decision` free-text field | Enterprise Assessment | Textarea | Decision signal, pattern reading, route context, not numeric score | `DECISION_REQUIRED`, `CONSEQUENCE_SIGNAL`, `AUTHORITY_SIGNAL` | Real decision reference for institutional reading | Executive Reporting, Strategy Room, Return Brief | No prior-attempt, recurrence, dependency, or verification history attached | `ADD_FOLLOWUP_ONLY` |

### Enterprise Assessment Summary

- Already high-yield: surfaced disagreement, signal trustworthiness, cost of delay, political resistance, governance friction.
- Diagnostic-only: all 12 scored questions remain primarily present-state reading questions.
- Downstream evidence already produced: band, route, dominant failure mode, decision-context signal.
- Strong-sounding but weak-evidence items: `governance-1` is useful directionally but too blended to serve as standalone governance proof.
- Missing categories before this upgrade: `PRIOR_ATTEMPT`, `FAILURE_CAUSE`, `RECURRENCE_SIGNAL`, `VERIFICATION_PROOF`, `DECISION_DEPENDENCY`, explicit escalation history.

## Final Recommendations

1. Preserve all protected Team Assessment pairings and all protected Enterprise Assessment pressure questions.
2. Do not alter score formulas or question IDs in this pass.
3. Add the evidence bridge only after the main reading is complete.
4. Persist `evidenceCapture` into the diagnostic payload, session handoff, and accumulated constitutional thread.
5. Treat the evidence bridge as the governed-memory layer that converts both assessments from diagnosis-only into downstream-governable evidence.
