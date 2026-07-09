# ADR — Canonical Persistence Authorities for the Compounding Intelligence System

**Status:** Accepted. Resolves the "safe-but-non-durable vs durable-but-unsafe" split flagged in the census (§3 of the continuation directive).

## Decision
The **canonical interaction spine** is the single authority for interaction, twin, tenant-binding, versioning, idempotency, and deletion. It is now both **safe** (tenant-isolated, consent/governance fail-closed) **and durable** (persisted to a real embedded database via better-sqlite3). The legacy tenant-less file memory/twin stores are **deprecated** and locked out of runtime by an architecture guard.

| Concern | Canonical module | Persistence model | Tenant binding | Case binding | Versioning | Idempotency | Deletion semantics | Runtime caller |
|---|---|---|---|---|---|---|---|---|
| Interaction persistence | `product-interaction-spine.ts` + `sqlite-interaction-store.ts` | SQLite `interactions` table (file/ephemeral) | `case_tenant` table, first-writer-binds, cross-tenant denied | `case_id` column + index | `supersedes`/`superseded_by` chain | `idempotency_key` unique per tenant | row delete + `tombstones` row | product runtime via `recordProductInteraction` |
| Memory persistence | same spine store (interactions ARE the governed memory events) | SQLite `interactions` | as above | as above | correction chain | as above | tombstone | spine |
| Twin persistence | `product-interaction-spine.ts` (applyToTwin) + `sqlite-interaction-store.ts` | SQLite `twins` (version + JSON state) | tenant-scoped key | case-scoped key | monotonic `version` | derived from interaction idempotency | deleted with case | spine |
| Outbox / event authority | `interaction-outbox.ts` + `sqlite-outbox-store.ts` | SQLite `outbox_events` + `outbox_consumed` + `outbox_tombstones` | `tenant_id` column | `case_id` column | schema_version | per-(event,consumer) consumed ledger | interaction tombstone blocks reconstitution | propagation driver |
| Read-model authority | `decision-centre-intelligence.ts` (`buildTwinSnapshotView`) | derived (read-only over twin) | ownership gate | case-scoped | reflects twin version | n/a | reflects deletion | Decision Centre page (pending render) |
| Correction / version authority | spine `recordProductInteraction(correctsInteractionId)` | SQLite | tenant-checked | case-checked | new version, prior preserved | new idempotency | n/a | product runtime |
| Deletion / tombstone authority | spine `deleteCaseData` + store `deleteCase` | SQLite tombstones | tenant-checked | case-scoped | n/a | tombstone blocks replay | rows removed, replay denied | product runtime / DSR handler |

## Legacy / deprecated
- `lib/decision-memory/decision-memory-store.ts` (file store) — **deprecated**; no runtime import (architecture guard enforces).
- `lib/product-moat/governed-strategic-twin.ts` / `strategic-twin-updater.ts` (tenant-less file twin) — **superseded** by the spine twin; not wired at runtime.
- Production Postgres/Prisma remains the estate's operational datastore for existing domains; the compounding spine uses the embedded DB locally and would bind to Prisma models in a full deployment (out of scope for this no-deploy worktree; the durability semantics are proven and portable).

## Consequence
There is no longer a state where the durable path is unsafe or the safe path is non-durable. The governed spine is both, proven by `sqlite-interaction-store.test.ts` (round-trip, isolation, correction, deletion, cross-connection durability) and `sqlite-outbox-store.test.ts` (durable propagation, retry, dead-letter, tombstone).
