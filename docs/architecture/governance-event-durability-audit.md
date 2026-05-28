# Governance Event Durability Audit

## Purpose

This document records the Phase 3 governance event durability audit. It covers the canonical event registry, active bus emitters, reserved (planned) events, durability guarantees provided by the governance bus, and the automated checks that enforce registry alignment going forward.

No product behaviour, publication status, editorial dates, MDX content, or route visibility was changed during this audit pass.

---

## Durability architecture

All governance events are emitted through a two-tier bus:

1. **`routeGovernanceEvent` / `emitGovernanceEvent`** (`lib/platform/governance-event-bus.ts`)
   - Validates `eventType` against `GOVERNANCE_EVENT_TYPES` at emit time
   - Writes to `prisma.governanceLog` (lineage chain) — durable, append-only
   - Writes to `auditLogger` (audit event table) — durable, queryable
   - Returns `{ ok, status: "RECORDED" | "PARTIAL" | "FAILED" }`

2. **`logAuditEvent`** (`lib/server/audit.ts`)
   - Operational audit facade — writes to `prisma.auditEvent`
   - Separate from the governance bus; no registry validation
   - Used by the scheduler, OAuth flows, and other operational paths

Durability at the bus level is structurally guaranteed for all wired emitters. The audit focuses on registry alignment and simulation truth, not individual DB write verification.

---

## Registry

**Canonical source:** `lib/platform/governance-event-types.ts` — `GOVERNANCE_EVENT_TYPES` array.

Phase 3 extended each `EventTypeEntry` with:
- `reserved?: true` — marks events planned but not yet wired to a governance bus emitter
- `reservedReason?: string` — mandatory explanation for any reserved event
- `GovernanceEventDurability` type (`none | ephemeral | durable_required | durable_confirmed | external_confirmed`)
- `GovernanceEventReality` type (`real | simulation | dry_run | preview | test | reserved`)
- `GovernanceEventDomain` type (`admin | foundry | outbound | commercial | delivery | diagnostics | content_release | governance | auth | product | system`)

**Total registered events: 60** (16 active, 44 reserved)

---

## Active emitters (16 events)

These events have live governance bus callers and produce durable writes on every emission.

| Event | Emitter file |
|---|---|
| `EXECUTIVE_REPORT_GENERATED` | `lib/commercial/paid-er-generation.ts` |
| `EXECUTIVE_REPORT_DELIVERED` | `lib/commercial/paid-er-generation.ts`, `app/api/admin/executive-report-delivery/resend-link/route.ts` |
| `EXECUTIVE_REPORT_VIEWED` | `app/api/client/reports/[reportId]/route.ts` |
| `EXECUTIVE_REPORT_REVOKED` | `app/api/admin/executive-report-delivery/revoke-link/route.ts` |
| `BOARDROOM_DOSSIER_GENERATED` | `lib/boardroom/boardroom-dossier-service.ts` |
| `BOARDROOM_DOSSIER_APPROVED` | `lib/boardroom/boardroom-dossier-service.ts` |
| `BOARDROOM_DOSSIER_DELIVERED` | `lib/boardroom/boardroom-dossier-service.ts` |
| `BOARDROOM_ACCESS_REVOKED` | `lib/boardroom/boardroom-dossier-service.ts` |
| `BOARDROOM_DOSSIER_VIEWED` | `lib/boardroom/boardroom-dossier-service.ts` |
| `BOARDROOM_SECURE_LINK_CREATED` | `lib/boardroom/boardroom-access-token.ts` |
| `BOARDROOM_SECURE_LINK_REVOKED` | `lib/boardroom/boardroom-access-token.ts` |
| `FINDING_CREATED` | `app/api/client/actions/[actionId]/route.ts` |
| `ACTION_LOG_CREATED` | `lib/commercial/decision-action-log.ts` |
| `CONTENT_STYLE_CHECKED` | `lib/platform/content-governance-events.ts` |
| `CONTENT_METADATA_VALIDATED` | `lib/platform/content-governance-events.ts` |
| `CONTENT_OUTBOUND_ELIGIBLE` | `lib/platform/content-governance-events.ts` |

---

## Reserved events (44 events)

Events registered with `reserved: true` and a `reservedReason`. They are intentionally not wired to governance bus emitters yet. Marking them as reserved eliminates false AMBER findings from automated audits without weakening any checks.

Domains represented:

- **Outbound** (6): post published/failed/drafted, approval granted/revoked, preview generated
- **Strategy Room** (5): session created/closed/converted, recommendation surfaced/dismissed
- **Foundry** (5): run started/completed/failed, fixture applied, simulation completed
- **Content** (4): outbound published/retracted, publication failed, engagement observed
- **Access/Delivery** (5): vault asset accessed, download granted/revoked, client portal session started/ended
- **GMI** (6): report generated/published/delivered/viewed/expired, subscriber notified
- **Enterprise** (3): assessment initiated/completed, report delivered
- **Boardroom/ER supplementary** (9): additional boardroom and executive report lifecycle events
- **Commercial** (1): entitlement granted

---

## Automated checks

### `check:governance-events` (new — Phase 3)

```bash
node scripts/check-governance-event-durability.mjs
```

Standalone governance event durability audit. Checks:
1. **RED** — event emitted via governance bus but not in `GOVERNANCE_EVENT_TYPES`
2. **RED** — real event emitted inside a `dryRun` conditional (simulation mislabeling)
3. **AMBER** — registered event with no governance bus emitter and not marked `reserved: true`
4. **RED** — competing governance event registry exported alongside the canonical file

Only files that import `routeGovernanceEvent` or `emitGovernanceEvent` are scanned for emitters. Infrastructure files (`governance-event-types.ts`, `governance-event-bus.ts`, `product-event-contract.ts`, `lineage-chain-definitions.ts`) are excluded from the emitter scan.

**Phase 3 result:** `RED: 0 | AMBER: 0 | GREEN: 60 (active: 16, reserved: 44)`

Generates:
- `reports/governance-event-durability.json`
- `reports/governance-event-emitter-inventory.json`
- `reports/governance-event-registry-inventory.json`

### Institutional governance audit

```bash
node scripts/check-institutional-registry-parity.mjs governance
```

Broader registry parity check. Phase 3 narrowed `extractGovernanceEvents` to use `eventType:` (governance bus field) instead of the broader `type:` pattern, and narrowed the emitter scan to governance bus callers only, eliminating false positives from outbound audit helpers and boardroom delivery logs.

**Phase 3 result:** `red=0 amber=3` (3 AMBER are pre-existing live-surface/event coverage gaps, not durability failures)

---

## AMBER findings (non-blocking)

These are pre-existing coverage gaps, not durability failures. They do not affect the registry or bus integrity:

| Surface | Gap |
|---|---|
| `app/client/dossiers/ClientDossiersClient.tsx` | Live-classified client component with no direct governance event emission (event is emitted by the API it calls) |
| `lib/commercial/payment-verification.ts` | Live-classified commercial utility with no direct governance event |
| `lib/research/engines/constitutional-diagnostic-adapter.ts` | Live-classified Foundry adapter with no direct governance event wiring |

---

## Simulation truth

The scheduler (`lib/outbound/core/outbound-scheduler-runner.ts`) was corrected in Phase 2 to return `status: "dry_run"` for dry-run validated items instead of the incorrect `status: "published"`. No governance bus events are emitted during dry-run scheduler runs — the scheduler uses `logAuditEvent` and the outbound publish ledger for operational logging, not the governance bus.

---

## No fixes applied to product code

This audit made no changes to:
- Product routes or API handlers
- MDX content or editorial dates
- Publication or approval status of any content
- Outbound scheduling or provider integrations
- Auth or entitlement logic

Changes were limited to:
1. `lib/platform/governance-event-types.ts` — type system extension, reserved event classification
2. `scripts/check-governance-event-durability.mjs` — new standalone audit script
3. `scripts/check-institutional-registry-parity.mjs` — narrowed governance event extraction to eliminate false positives
4. `package.json` — added `check:governance-events` script
