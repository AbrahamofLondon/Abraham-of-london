# Advantage Layer IP Safety Audit

Date: 2026-05-09

| File | Phrase / behavior | Exposure type | Public / private / operator | Action taken or recommended |
|---|---|---|---|---|
| `components/Intelligence/DecisionTracePanel.tsx` | Signals triggered, rejected alternatives, stage history | Internal reasoning scaffolding | `operator` | Keep private; do not route into user-facing runtime |
| `components/Intelligence/DeterminismProof.tsx` | Determinism / auditable logic / proprietary multi-factor framing | Mechanism and assurance leak | `operator` | Keep private or remove |
| `components/Intelligence/SpineRenderer.tsx` | Decay, control shift, risk trend mechanics | Internal model mechanics | `operator` | Keep private |
| `components/Intelligence/KnowledgeGraph.tsx` | Ranked recommendation logic, lift/rank/conversion exposure | Graph and recommendation method | `operator` | Keep private |
| `components/Intelligence/DiscoveryOverlay.tsx` | Internal actor/resource discovery data | Operational/internal console exposure | `operator` | Keep private |
| `components/trust/GovernanceDisclosure.tsx` | Live confidence percentage with failure modes | Precision leak rather than full mechanic leak | `public` if shown | Reduce or contextualize confidence value |
| `components/Intelligence/ContradictionMapPreview.tsx` | Safe preview hides mechanics successfully | Low direct leak | `public` | Keep public, but improve truthfulness fields |
| `components/Intelligence/CrossAssessmentInsight.tsx` | Surface-level conflict interpretation only | Low direct leak | `public` | Keep public |
| `lib/analytics/contradiction-graph-presenter.ts` | Builds safe contradiction card from graph/living case | Mechanic hidden at UI layer | `private logic` | Safe if UI continues to show only transformed result |
| `pages/diagnostics/executive-reporting/run.tsx` | "behind AI baseline" copy | Competitive framing / benchmark method implication | `public` | Remove or harden before exposure |

## Public-Safe

Safe to surface:

- Decision velocity consequence language
- Cross-assessment plain-language conflicts
- Contradiction plain-language summaries
- Arbiter trust badge states without rule details
- Irreversibility estimates with caution

## Suppress For IP

Suppress from public runtime:

- Graph structure, node/edge detail
- Ranked recommendation logic
- Internal audit/determinism proof components
- Forecast/decay/control mechanics
- Unanchored confidence or benchmark language that hints at model construction

## Final IP Judgment

The newly activated shared advantage cards are largely IP-safe because they surface consequence rather than mechanism. The highest IP risk does not come from the new rollout itself; it comes from older internal `components/Intelligence/*` surfaces remaining in the same folder and still looking superficially product-ready. They should be treated as operator-only.

