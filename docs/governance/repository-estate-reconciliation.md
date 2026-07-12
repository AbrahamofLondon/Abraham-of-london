# Repository Estate Reconciliation — Governance Record

**Date:** 2026-07-12
**Branch:** reconcile/repository-estate-2026
**Base:** origin/main (ba5fc593d)
**Validated implementation HEAD before governance closure:** 8f522ad6d846b6348598729fbf6ef3a33e07aa3d
**Implementation commits above base before this record:** 29
**Current branch identity:** derive from git rev-parse HEAD; this record does not hard-code its own commit SHA.

## Domains Integrated

| Domain | Commits | Source |
|---|---|---|
| Visual authority | 5 | integration/visual-authority-convergence |
| GMI routing, vault repair, React fixes | 4 | integration/visual-authority-convergence |
| Playwright restoration | 1 | integration/visual-authority-convergence |
| Dependency normalization | 1 | — |
| Estate-market restoration | 8 | work/estate-market-restoration |
| Integration compatibility fixes | 2 | — |
| Evidence-gated accountability surfaces | 1 | work/estate-market-restoration |

## Branches Reviewed and Omitted

| Branch | Reason |
|---|---|
| auth/recovery-clean (5 commits) | Superseded by current auth architecture |
| safety/commercial-activation-convergence (6 commits) | Superseded by current commercial architecture |

## Fathering Without Fear — KEEP_AND_SHIP

Commit 4b9e91ade modifies two pre-existing files:
- content/source-material/fathering-without-fear/drafts/ch15-david-was-missing-from-the-wedding.mdx
- private/submission-packages/fathering-without-fear/current-package/04-one-page-synopsis.md

Owner-approved for inclusion. No revert. No extraction.

## GMI Release Chain — Q2 Current, Q1 Superseded

GMI Q2 2026 is the current published and purchasable edition.

Its authoritative lifecycle state is ACTIVE_UNTIL_SUPERSEDED. It remains publicly visible and available through the canonical £59 self-serve checkout, using the existing GMI Stripe product and Q2 price binding.

GMI Q1 2026 is SUPERSEDED. It remains publicly available as historical reference and for the public call-scoring record, but it is hidden from current pricing and has no new standalone checkout.

GMI Q3 2026 remains a non-public, non-purchasable draft.

The reconciliation did not create a new Stripe product or price. It preserved the already-authorised Q2 release, checkout, entitlement and fulfilment chain.

## Evidence Authority Boundary

The public accountability surfaces now use a branded opaque type (VerifiedMarketEvidence)
that cannot be constructed outside the trusted resolver module. Runtime validation:

- Receipt registry: server-owned implementation
- Source provider: server-owned implementation
- API accepts receipt ID from client as authority: NO
- API accepts evidenceAuthority from client: NO
- API accepts raw calls and labels them authoritative: NO
- Edition must be RELEASED: YES
- Receipt must match edition: YES
- Payload hash must match calls: YES
- Sources must be verified: YES
- Unknown/forged receipt rejected: YES
- Draft/controlled edition rejected: YES

## Validation Summary

| Gate | Result |
|---|---|
| Frozen install | PASS |
| Typecheck | PASS |
| Build | PASS |
| Unit tests | 7,563 / 7,568 passed; 5 documented failures |
| Playwright | 6 passed, 7 documented failures, 32 explicit baseline-capture skips |
| Vault audit engine | institutional-audit.mjs |
| Vault policy | 56 advisory path-regression violations (pre-existing) |
| Working tree | CLEAN |
| Stripe mutation | None |
| Auth architecture | Unchanged |

## Release Authority

**Decision:** READY_FOR_REVIEW
**Human review required before merge.**