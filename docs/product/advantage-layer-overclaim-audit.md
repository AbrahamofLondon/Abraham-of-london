# Advantage Layer Overclaim Audit

Date: 2026-05-09

| Current wording | Why risky | Corrected wording | File path |
|---|---|---|---|
| "Your last recorded checkpoint cycle averaged X days to first response." | Metric is aggregate average across responded checkpoints, not necessarily the last cycle. | "Your recorded checkpoint history currently averages X days to first response." | `lib/analytics/decision-velocity.ts` |
| `decisionVelocityRisk: "... behind AI baseline ..."` | Unsupported benchmark/comparator claim; brief explicitly prohibited cohort or benchmark claims unless real and defensible. | Remove entirely, or replace with a case-only phrasing such as "Decision movement remains slower than the current recorded execution requirement." | `pages/diagnostics/executive-reporting/run.tsx` |
| Hard-coded `Evidence posture: system inferred` on every contradiction card | Overstates certainty and may mislabel carried-forward/user-derived contradiction summaries. | Bind to actual evidence posture or use "Evidence posture: mixed" / "Evidence posture: not independently verified" when unresolved. | `components/Intelligence/ContradictionMapPreview.tsx` |
| "Verification: passed" in determinism proof surface | Claims verification where there is only internal product framing. | Suppress for public runtime; operator-only if retained. | `components/Intelligence/DeterminismProof.tsx` |
| "Same input produces same output" | Strong determinism claim not appropriate for probabilistic/system-composed runtime. | Suppress for public runtime; if retained internally: "This run followed the expected internal review path." | `components/Intelligence/DeterminismProof.tsx` |
| "The logic path is auditable" | Exposes internal reasoning framing and overstates external user relevance. | Suppress publicly. | `components/Intelligence/DeterminismProof.tsx` |
| "Ranked Recommendation Logic" / ranked graph phrasing | Exposes recommendation method and scoring posture. | Suppress publicly; operator-only. | `components/Intelligence/KnowledgeGraph.tsx` |
| "The system deepens its reading" | Can imply hidden model certainty rather than evidential accumulation. | "Additional governed evidence has been carried forward." | `components/Intelligence/SpineRenderer.tsx` |
| "This report is carrying forward prior governance evidence. The recommendation has not been generated in isolation." | Safe overall, but can still sound stronger than the actual stored evidence basis if inherited evidence is thin. | "This report is carrying forward prior governance evidence where available. The recommendation reflects the recorded case history." | `pages/diagnostics/executive-reporting/run.tsx` |
| "The system will use it to update case memory and governance signals." | Broad but acceptable; still slightly opaque in high-stakes response capture. | "Your response will update the recorded case history and any dependent governance signals." | `app/briefing/return/[sessionId]/page.tsx` |

## Summary

Primary overclaim classes:

- Unsupported benchmark/comparator claims
- Over-precise evidence posture
- Determinism / verification language for internal-only surfaces
- Aggregate metrics described as single-cycle facts

P0 overclaims:

- Executive Reporting AI baseline copy
- Contradiction evidence posture hard-code
- Any public exposure of determinism proof surfaces

