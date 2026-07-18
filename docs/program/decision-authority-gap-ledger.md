# Decision Authority Gap Ledger

Status: ACTIVE GAP LEDGER
Repository: `C:\aol-check-visual`
Consumer matrix: `reports/product/decision-authority-consumer-matrix.json`
Machine ledger: `reports/product/decision-authority-gap-ledger.json`

## Status Rules

Allowed statuses only:

- UNASSESSED
- CONFIRMED_GAP
- IMPLEMENTING
- LOCALLY_PROVED
- CI_PROVED
- PREVIEW_PROVED
- PRODUCTION_PROVED
- CLOSED

A gap cannot move directly from IMPLEMENTING to CLOSED. Phase 0 and Phase 1 work is not finally closed; locally proved entries still require CI, preview, production and release evidence.

## Machine-Enforced Invariants

- COMMERCIAL-01: A checkout session contains one unambiguous catalogue code, entitlement slug, Stripe product ID, Stripe price ID and metadata schema version.
- COMMERCIAL-02: Conflicting payment identities fail closed.
- COMMERCIAL-03: Duplicate and out-of-order webhook events do not duplicate entitlement or fulfilment.
- COMMERCIAL-04: Successful payment cannot be marked fulfilled until entitlement and required delivery operations reach their defined terminal state.
- PUBLIC-01: The public API cannot expose paid dossier fields, internal graph nodes, authority objects, raw evidence or checkout controls.
- PUBLIC-02: Public routes cannot directly import the internal decision kernel.
- PERSISTENCE-01: No raw situation text is stored in the public-safe event path.
- PERSISTENCE-02: A reported durable write must exist in the database and survive process restart.
- PERSISTENCE-03: Memory fallback cannot be reported as durable success.
- PERSISTENCE-04: Repeated request IDs are idempotent.
- PERSISTENCE-05: One user or anonymous case cannot read another case's events.
- GRAPH-01: Accumulated depth is derived only from authorised public-safe events.
- OUTCOME-01: Outcome verification is tied to the exact decision, owner, action and deadline.
- ROUTING-01: Every product and diagnostic has one canonical public route.
- PRIVACY-01: Retention and deletion remove all linked public-safe records according to the defined policy.

## Gap Summary

| Gap ID | Status | Current State |
|---|---|---|
| COMMERCIAL-IDENTITY | LOCALLY_PROVED | Checkout metadata and resolver compatibility are locally implemented and tested. |
| COMMERCIAL-WEBHOOK-IDEMPOTENCY | CONFIRMED_GAP | Existing idempotency exists, but adversarial route-level duplicate/out-of-order proof is incomplete. |
| COMMERCIAL-FULFILMENT-TERMINAL | CONFIRMED_GAP | Product fulfilment is mixed durable/manual/stubbed; global terminal-state invariant is not enforced. |
| PUBLIC-APERTURE | LOCALLY_PROVED | Static API route guards and public route integrity checks pass locally. |
| PERSISTENCE-DURABILITY | IMPLEMENTING | Public-safe adapter exists; durable-vs-memory semantics still need DB integration proof. |
| PERSISTENCE-ISOLATION | CONFIRMED_GAP | Isolation tests are required before any accumulated read path. |
| GRAPH-ACCUMULATION | CONFIRMED_GAP | Not started by instruction. Public-safe event base exists for later. |
| OUTCOME-LOOP | CONFIRMED_GAP | Outcome infrastructure exists but is not wired into public signal flow. |
| ROUTING-CANONICAL | CONFIRMED_GAP | Router migration remains deferred. Canonical billing route remains Pages Router. |
| PRIVACY-RETENTION | CONFIRMED_GAP | Retention/deletion proof is not yet implemented for public-safe signal records. |
| OBSERVABILITY-RELEASE-GATES | CONFIRMED_GAP | Telemetry and alert requirements are defined; implementation remains open. |
| E2E-GOLDEN-PATHS | CONFIRMED_GAP | Required cross-route E2E golden paths are not yet implemented. |

## Review Rule

The JSON ledger is authoritative for field-level details: business consequence, affected customer journey, source, consumers, failure modes, tests, telemetry, rollback, owner and final evidence. This Markdown file is the human review index.
## Phase 1.5 Architecture Delta

- ARCH-01 — decision-engine authority ambiguity: CONFIRMED_GAP.
- ARCH-02 — possible parallel decision records: CONFIRMED_GAP.
- ARCH-03 — one-off versus accumulated kernel operation: CONFIRMED_GAP.
- ARCH-04 — router security/cache consistency: CONFIRMED_GAP.
- ARCH-05 — SharedMemoryBridge authority unknown: CONFIRMED_GAP; classified UNUSED until proven otherwise.
- ARCH-06 — hot-state storage need unproven: CONFIRMED_GAP; Redis remains not introduced and not justified by current evidence.
- ARCH-07 — abstraction duplication risk: CONFIRMED_GAP.

None of these entries may move to CLOSED from static inspection alone. Runtime route proof, single-record contract enforcement, preview/production evidence and release-gate governance are required.
