# Portfolio Memory Exposure Policy

Status after this pass: portfolio pattern memory remains internal by default.

## Rules

- No public route exposes portfolio intelligence.
- No sponsor-safe route exposes cross-organisation pattern memory without explicit organisation or portfolio entitlement.
- Any exposed version must be aggregate-only.
- Small-sample states must be suppressed rather than approximated.
- Neutral labels only:
  - `Recurring pattern observed across authorised entities`
  - `Shared divergence pattern observed in authorised aggregate context`

## Current posture

- `lib/product/portfolio-pattern-memory.ts` remains an internal composition utility.
- The current sponsor-safe retained oversight surface does not expose portfolio memory.
- If entitlement is absent, output should remain `null` with a visible reason rather than falling back to inferred portfolio claims.

## Required before exposure

1. Explicit portfolio entitlement contract.
2. Aggregate suppression thresholds enforced in the loader.
3. Role boundary mapped for sponsor-safe portfolio visibility.
4. Audit trail for when portfolio context was shown and why.

