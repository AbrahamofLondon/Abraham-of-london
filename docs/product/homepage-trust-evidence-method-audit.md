# Homepage Trust, Evidence, and Method Audit

Date: 2026-05-09

## Overall Verdict

Trust posture is conceptually strong and operationally better than average. Homepage execution still overstates what is visibly proved on-page.

## Major Trust Claims

| Claim | Location | Evidence Supporting It | Risk | Needed Caveat | Keep / Rewrite / Remove |
| --- | --- | --- | --- | --- | --- |
| `can refuse to proceed` | Hero, trust grid, demo | Refusal demo clearly supports this posture | Low | None | Keep |
| `No generic output` | Hero, flagship block | No visible side-by-side proof, but consistent with product intent | Medium | Show a concrete returned artifact | Rewrite |
| `No sale if the case is not ready` | Hero, trust grid | Recommendation engine philosophy supports it | High | Homepage currently links directly into later-stage routes | Rewrite |
| `Each stage adds evidence. Nothing resets.` | Ladder | Consistent with recommendation engine and governance surfaces | Medium | Needs visible continuity proof | Rewrite |
| `Source-labelled evidence` | Trust grid | Standards page strongly supports this | Low | None | Keep |
| `No fabricated verification` | Trust grid | Standards page and proof fallback logic support this | Low | None | Keep |
| `Commitment memory` | Trust grid | Governance concepts support it | Medium | Show checkpoints or a memory artifact | Rewrite |
| `Protected internals` | Trust grid | Supported by standards posture | Low | None | Keep |
| `Challenge route` | Trust grid | Governance disclosure components support this pattern elsewhere | Medium | Show where the challenge route lives | Rewrite |
| `Earned progression` | Trust grid | Recommendation engine supports it in principle | High | Homepage CTA behavior currently contradicts it | Rewrite |
| `verified executive memory` | Layout description | No homepage proof at this level | High | Replace with less final wording | Rewrite |
| `board-grade` | `WhoThisIsFor` | Flagship framing points in this direction | Medium | Needs proof surface, standards, or case artifact nearby | Rewrite |

## Classification of Major Claims

- `SAFE_AND_STRONG`
  - refusal capability
  - source-labelled evidence
  - no fabricated verification
  - protected internals

- `SAFE_BUT_WEAK`
  - no generic output
  - commitment memory
  - challenge route

- `TRUE_BUT_NEEDS_CAVEAT`
  - board-grade
  - nothing resets

- `OVERCLAIM`
  - earned progression
  - verified executive memory

## Proof Layer Audit

`components/proof/PublicProofBlocks.tsx` is better than the homepage around it because it:

- labels fallback proof as `DEMONSTRATION_FALLBACK`
- hides metrics unless `sampleSize >= 15`
- separates live evidence from fallback pattern language

Homepage problem:

- these proof blocks are not the dominant trust surface
- the page spends more words claiming governance than proving outcome quality

## Method Disclosure Audit

Method disclosure is broadly well judged:

- enough stated to sound serious
- internal scoring and routing are not exposed
- standards page is materially stronger than the homepage trust summary

Method risk:

- the homepage references internal concepts like contradiction memory and governed output without anchoring them in an artifact the user can inspect

## What the Homepage Still Needs

1. One concrete continuity artifact
   - checkpoint record
   - contradiction carry-forward
   - before/after decision state
2. One visible output artifact
   - decision headline
   - consequence estimate clearly labelled as estimate
   - action / restriction / follow-up
3. One more explicit line on what happens after submission
   - what is stored
   - what is labelled
   - what is not claimed

## Bottom Line

The trust doctrine is mostly sound. The homepage needs to stop repeating doctrine and instead spend scarce real estate proving two things: refusal is real, and memory is real.
