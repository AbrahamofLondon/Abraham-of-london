# Intelligence Layer UX Verdict

Date: 2026-05-09

| Surface / component | UX verdict | Reason |
|---|---|---|
| Decision velocity | `useful` | Converts checkpoint history into a visible performance record and prompts action. |
| What changed | `premature` | Good retention concept, but current prior-state capture is too thin to support the promise consistently. |
| Cross-assessment intelligence | `promote higher` | Best proof that the product remembers and compares across assessments without exposing machinery. |
| Contradiction preview | `useful` | Distinctive and actionable, but under-specified without first/last seen and next action. |
| Arbiter trust badge | `useful` | Concise trust cue without leaking rules. |
| Irreversibility | `useful` | Converts hidden estimation into visible consequence, but needs provenance/date. |
| Intelligence Memory page | `decorative` in current state | Wrapper page is too thin and can render nothing meaningful without clear insufficiency guidance. |
| Intelligence Contradictions page | `premature` | Good concept, but current page is just a wrapper around an under-complete card and may show the wrong case. |
| Executive Reporting shared intelligence stack | `confusing` | Duplicates contradiction surfaces and mixes strong/new runtime surfaces with legacy blocks. |
| Strategy Room entry cross-assessment card | `premature` | Valuable concept, but wrong-case risk undermines trust. |

## Overall Judgment

The new layer is not decorative by default. The strongest pieces already improve efficacy:

- decision velocity
- cross-assessment intelligence
- contradiction preview
- irreversibility

The weakest pieces fail because of runtime truthfulness, not because the product concept is weak:

- case scoping is missing on shared stack consumers
- `What changed` promises more history than the system currently persists
- wrapper pages do not handle empty/thin states strongly enough
- Executive Reporting still carries legacy bloat that dilutes the new intelligence layer

## Promote / Suppress

Promote higher:

- Cross-assessment intelligence in Decision Centre
- Decision velocity in Decision Centre and Return Brief once case-scoped
- Irreversibility in Strategy Room session and Decision Centre with provenance

Suppress until more data:

- Intelligence Memory page as a standalone destination
- Intelligence Contradictions page as a standalone destination
- Any benchmark or AI-baseline comparison copy

Keep private/operator-only:

- Decision trace, determinism proof, graph tooling, discovery overlay, spine renderer

