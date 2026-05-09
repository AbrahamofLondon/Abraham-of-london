# Homepage CTA / Earned Progression Audit

Date: 2026-05-09

## Verdict

The homepage does not currently obey its own earned-progression principle.

## CTA Register

| CTA Text | URL | Section | Intended User State | Progression Verdict | Role Verdict | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `Test a decision` | `/diagnostics/fast` | Hero | First-time visitor with a live decision | Respects progression | `CORRECT_PRIMARY` | Best homepage CTA |
| `See the governed review` | `#refusal-engine` | Hero | Skeptical visitor | Respects progression | `CORRECT_SECONDARY` | Strong proof CTA |
| `Run Enterprise Assessment` | `/diagnostics/enterprise-assessment` | Buyer pathways | Operators/teams | Bypasses progression | `BYPASSES_EARNED_PROGRESSION` | Sends users past the front-door start path |
| `Enter Executive Reporting` | `/diagnostics/executive-reporting` | Buyer pathways | Boards/founders | Bypasses progression | `WRONG_DESTINATION` | Paid/late-stage route exposed too early |
| `Start Fast Diagnostic` | `/diagnostics/fast` | Buyer pathways | Individual leaders | Respects progression | `CORRECT_SECONDARY` | Keep if block survives |
| `View evidence standards` | `/evidence/standards` | Trust grid | Trust-seeking visitor | Respects progression | `CORRECT_SECONDARY` | Good proof-support CTA |
| `Test a decision` | `/diagnostics/fast` | Front-door final CTA | Warm visitor | Respects progression, but mistimed | `REMOVE` | Correct route, wrong placement |
| `View evidence` | `/evidence/{slug}` | Observed in practice cards | Trust-seeking visitor | Respects progression | `CORRECT_SECONDARY` | Useful, but proof arrives too late |
| `Open Executive Reporting` | `/diagnostics/executive-reporting` | Flagship output block | Qualified visitor | Bypasses progression on homepage | `WRONG_DESTINATION` | Should be gated through evidence-ready framing |
| `View Strategy Room criteria` | `/strategy-room` | Flagship output block | Highly qualified visitor | Borderline | `CORRECT_SECONDARY` | Better than direct `Enter Strategy Room` |
| `Institutional` | `/institutional` | Engagement lanes | Non-diagnostic visitor | Neutral | `CORRECT_TERTIARY` | Fine if compressed |
| `Private clients` | `/private-clients` | Engagement lanes | Non-diagnostic visitor | Neutral | `CORRECT_TERTIARY` | Fine if compressed |
| `Education & research` | `/education-research` | Engagement lanes | Non-diagnostic visitor | Neutral | `CORRECT_TERTIARY` | Fine if compressed |
| `Media` | `/media` | Engagement lanes | Non-diagnostic visitor | Neutral | `CORRECT_TERTIARY` | Fine if compressed |
| `Verify the founder` | `/verification` | Trust strip | Trust-seeking visitor | Neutral | `CORRECT_TERTIARY` | Useful trust path |
| `Read trust boundaries` | `/trust` | Trust strip | Trust-seeking visitor | Neutral | `CORRECT_TERTIARY` | Useful trust path |
| `See applied evidence` | `/evidence` | Trust strip | Trust-seeking visitor | Neutral | `CORRECT_TERTIARY` | Useful trust path |
| `Review foundations` | `/foundations` | Trust strip | Trust-seeking visitor | Neutral | `CORRECT_TERTIARY` | Useful but abstract |

## Structural CTA Problems

1. The page includes a final CTA before it has shown applied evidence and flagship output.
2. The page claims progression is earned, but directly routes to `Enterprise Assessment` and `Executive Reporting`.
3. The homepage still behaves like a product menu for some audience segments.

## Required CTA Hierarchy

- Primary: `Test a decision` -> `/diagnostics/fast`
- Secondary: proof / refusal / standards
- Tertiary: trust, verification, alternate lanes
- Remove from homepage primary flow: direct entry to `Executive Reporting`
- Keep cautious: `Strategy Room criteria`, not `Enter Strategy Room`

## Recommendation

The homepage should invite evidence submission, not product selection. Direct product-entry CTAs should appear only after the page has shown:

- what the system returns
- what gets remembered
- why escalation is earned
