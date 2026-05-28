# Governance Event Promotion Workflow

## Purpose

This document defines the four-stage maturity pipeline for governance events, from initial concept through live governed operation. It specifies the evidence, emitter, record, surface, and approval requirements for each stage transition.

No events are promoted in this document. Promotion is a separate production decision that must satisfy all criteria defined here.

---

## Maturity stages

```
RESERVED_CONCEPT → SIMULATION_ONLY → PILOT_READY → LIVE_GOVERNED
```

### Stage 0 — RESERVED_CONCEPT

The event is registered in `GOVERNANCE_EVENT_TYPES` as vocabulary. No governance bus emitter exists. No product surface invokes it.

**Use when:** The domain is planned and the event name is locked for future wiring. Prevents naming drift.

---

### Stage 1 — SIMULATION_ONLY

The event is emitted inside a Foundry simulation run or a `dryRun` conditional. It does not reach a production user or create a durable record in the live governance log.

**Use when:** The engine is built and testable via the Foundry admin console, but the product surface is not yet wired to real user sessions.

---

### Stage 2 — PILOT_READY

The event is emitted in real code paths (not simulation-only), but the product surface is gated to a pilot cohort, an internal role, or a feature flag. The governance bus write is wired and produces durable records.

**Use when:** End-to-end wiring is confirmed and durable writes are verified, but full production rollout has not been approved.

---

### Stage 3 — LIVE_GOVERNED

The event is emitted in production code paths accessible to entitled users. Every emission produces a durable write to `prisma.governanceLog` and `auditLogger`. Product Health rule 6 (`checkGovernanceEvents`) returns GREEN for surfaces that declare this event.

---

## Transition requirements

### RESERVED_CONCEPT → SIMULATION_ONLY

| Requirement | Detail |
|---|---|
| **Evidence** | Foundry simulation run produces the event without errors. `selfTest()` passes on the adapter. |
| **Emitter** | Event emitted from within a Foundry `run()` call or an explicit `if (dryRun)` block. The event type must include `SIMULATED`, `DRY_RUN`, or `PREVIEW` in its name, OR the emitting block must be gated on `dryRun === true`. |
| **Durable record** | Not required. Simulation events are ephemeral by design. |
| **Admin/product surface** | Foundry simulation admin page must exist (`/admin/intelligence-foundry/simulation/[product]`). |
| **Product Health effect** | No change to GREEN. Simulation events do not count as live coverage in Rule 6. |
| **Dashboard visibility** | Visible in Foundry simulation panel. Not visible in production governance log. |
| **Approval** | Engineering decision. No formal approval required. |

---

### SIMULATION_ONLY → PILOT_READY

| Requirement | Detail |
|---|---|
| **Evidence** | Real product user session (not Foundry run) triggers the event. At least one confirmed durable write in the governance log (`prisma.governanceLog`). Failure path tested: bus `FAILED` / `PARTIAL` status handled without silent swallow. |
| **Emitter** | Event emitted via `routeGovernanceEvent` or `emitGovernanceEvent` from a non-simulation code path. No `if (dryRun)` gate wrapping the emission. |
| **Durable record** | `writesLineage: true` or `writesAudit: true` must be set in the registry entry. At least one real record confirmed in the `governanceLog` table (not via Foundry). |
| **Admin/product surface** | Product route exists and is reachable under correct auth. Admin owner surface declared in `admin-domain-registry.ts`. |
| **Product Health effect** | Rule 6 (`checkGovernanceEvents`) returns AMBER for the surface until the event is confirmed `LIVE_GOVERNED`. Reserved/simulation events do not satisfy GREEN. |
| **Dashboard visibility** | Visible in governance log viewer and lineage chain. Admin audit trail shows emission. |
| **Approval** | Requires engineering sign-off. The `reserved: true` flag must be removed from the registry entry. |

---

### PILOT_READY → LIVE_GOVERNED

| Requirement | Detail |
|---|---|
| **Evidence** | Multiple real governance log entries across different sessions/users. `writesAudit` and/or `writesLineage` confirmed true. No open RED findings against the product surface in Product Health. Auth guard on the product route confirmed. Route registered in `route-deployment-registry.ts`. |
| **Emitter** | Live in production code path. No simulation/dryRun conditional wrapping the emission. Emitter file is not in `INFRASTRUCTURE_FILES`. |
| **Durable record** | `prisma.governanceLog` record confirmed. `auditLogger` record confirmed (if `writesAudit: true`). Bus returns `RECORDED` status, not `PARTIAL` or `FAILED`, in steady state. |
| **Admin/product surface** | Product ladder entry exists in `PRODUCT_LADDER`. Admin owner surface confirmed reachable. Product Health Rule 6 returns GREEN for the surface. |
| **Product Health effect** | Rule 6 returns GREEN. Surface contributes to the active governance event count. |
| **Dashboard visibility** | Visible in admin governance log, lineage chain, audit viewer, and Product Health dashboard. |
| **Approval** | Requires explicit promotion action: remove any `reserved: true`, set `maturity: "LIVE_GOVERNED"` in registry entry, update the governance-event-durability audit document. |

---

## Rules for Product Health (Rule 6)

These rules govern how `checkGovernanceEvents` in `lib/research/product-health/product-health-rules.ts` evaluates a surface:

| Event maturity | Rule 6 outcome |
|---|---|
| Not registered | RED — event not in `GOVERNANCE_EVENT_TYPES` |
| `RESERVED_CONCEPT` | AMBER — vocabulary only, bus wiring pending |
| `SIMULATION_ONLY` | AMBER — simulation context only, not live |
| `PILOT_READY` | AMBER — wired but not fully promoted |
| `LIVE_GOVERNED` | GREEN — active, durable, governed |

**Reserved ≠ live. Simulation ≠ live. Pilot ≠ fully live.** Only `LIVE_GOVERNED` events satisfy GREEN for Product Health.

---

## What this workflow does NOT govern

- Publication status of editorial content (governed by contentlayer frontmatter)
- Outbound post approval (governed by `approvalStatus` field and `outbound-scheduler-runner.ts`)
- Payment events (governed by Stripe webhook lifecycle)
- Internal diagnostic events that do not pass through `routeGovernanceEvent` / `emitGovernanceEvent`

---

## Current pipeline snapshot (as of Phase 5)

| Stage | Count |
|---|---|
| `LIVE_GOVERNED` | 16 |
| `PILOT_READY` | 0 |
| `SIMULATION_ONLY` | 2 |
| `RESERVED_CONCEPT` | 42 |
| Retired | 0 |

No events were promoted during Phase 5. This document establishes the criteria for future promotions.
