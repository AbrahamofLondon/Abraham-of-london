# Intelligence Surface Data Quality Matrix

Date: 2026-05-09

| Surface | Data available | Data missing / weak | Confidence level | Allowed language | Prohibited language |
|---|---|---|---|---|---|
| Decision Centre | Checkpoints, living case, strategy status, contradictions, owned products, memory items | No explicit compared dates in `What changed`; irreversibility provenance thin | `MEDIUM-HIGH` | "Based on your recorded decisions", "Earlier evidence suggests", "This appears to be becoming harder to reverse" | "The graph proves", "verified" for self-report, hidden benchmark claims |
| Fast Diagnostic | Local result, optional checkpoint baseline, later API-backed case card | Initial velocity is synthetic baseline until server history exists | `MEDIUM` | "Baseline created", "The next governed response will establish decision velocity", "Quality checks passed" | "You are improving", "verified outcome" |
| Return Brief | Return brief session data, checkpoints, outcome evidence, carried-forward evidence | Shared intelligence stack not scoped to session case | `LOW` until scoped | "The system remembers this case", "No durable checkpoint history exists yet" | Any cross-case intelligence implication |
| Executive Reporting | Canonical report, financial exposure, inherited memory, irreversibility estimate | Shared stack unscoped; duplicate contradiction surface; unsupported AI baseline phrase | `LOW-MEDIUM` | "This is an estimate", "Evidence carried forward", "Cross-assessment signal detected" | "Behind AI baseline" unless benchmark is defended, duplicate contradiction certainty |
| Strategy Room Entry | Canonical execution context, counsel status, admission state | Shared cross-assessment card unscoped | `LOW` until scoped | "The record suggests", "Execution route is active" | Any claim tied to another case’s memory |
| Strategy Room Session | Session decisions, checkpoint state, financial exposure, execution state | Irreversibility provenance/date not surfaced | `MEDIUM` | "Irreversibility estimate", "This is not a verified external fact" | "Proven irreversible", "verified harm" |
| Intelligence Memory | Whatever the first fetched case exposes via `ClientIntelligenceStack` | No explicit empty state, no user-selected case, no dated comparison view | `LOW` | "Baseline created", "What the record now suggests" | "Trend" without dated history |
| Intelligence Contradictions | Whatever the first fetched case exposes via `ClientIntelligenceStack` | No scoping, no first/last seen, no next action | `LOW` | "Active contradiction", "The record currently points toward" | Any graph/mechanics language, false confidence posture |

## Shared Card Conditions

| Component | No data | One data point | Two data points | Multiple data points |
|---|---|---|---|---|
| `DecisionVelocityCard` | Suppress or show insufficiency summary | Baseline only | Early measured movement allowed | Strongest and most useful |
| `WhatChangedPanel` | Baseline message required | No trend claim | Limited cautious movement | Still constrained by missing prior-state capture |
| `CrossAssessmentInsight` | Suppress | Usually suppress unless another surface exists | Real conflict/reinforcement possible | Strong, defensible moat surface |
| `ContradictionMapPreview` | Suppress | One contradiction safe | Better with trend/date fields | Useful but currently incomplete |
| `ArbiterBadge` | Safe | Safe | Safe | Safe |

## Language Discipline

Use:

- "The record suggests"
- "Earlier evidence indicates"
- "Based on your recorded decisions"
- "This has not yet been independently verified"
- "Baseline created"
- "Irreversibility estimate"

Do not use:

- "The graph proves"
- "The kernel detected"
- "The algorithm shows"
- "Verified" for self-reported or unverified user action
- Unsupported benchmark claims

