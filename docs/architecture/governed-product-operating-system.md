# Governed Product Operating System

## Purpose

The Abraham of London platform is one integrated governed operating system, not a collection of disconnected product surfaces. This document defines the architecture that enforces that integration.

## Core Operating Spine

Every user-facing product action flows through this spine:

```
User-facing product action
  → Product Event
    → Canonical Record
      → Access / Entitlement State
        → Audit / Lineage Event
          → Admin Visibility
            → Foundry Testability
              → Action / Escalation / Outbound / Improvement
```

### Spine Stages

1. **User Action** — The user performs an action (takes a diagnostic, views a report, publishes content)
2. **Product Event** — A typed event is emitted describing what happened
3. **Canonical Record** — A persistent record is created/updated in the system of record
4. **Access State** — Entitlement/access gates are checked and recorded
5. **Audit Event** — An audit trail entry is written
6. **Lineage Event** — A lineage chain entry is appended
7. **Admin Visibility** — The action appears in the appropriate admin domain
8. **Foundry Testability** — A Foundry module can simulate or test this flow
9. **Action/Escalation** — If the event indicates risk, an escalation or ResearchRun is created

## Seven Questions

Every product surface must answer:

1. **What record does it create?** — The canonical record type
2. **What admin surface sees it?** — The admin route that monitors it
3. **What Foundry module can test it?** — The Foundry engine that simulates it
4. **What audit/lineage event does it emit?** — The event types it produces
5. **What entitlement governs it?** — The access tier or grant required
6. **What outbound/content pathway can surface it?** — Whether it can be published
7. **What ResearchRun can improve it?** — Whether failures create ResearchRuns

If a surface cannot answer these, it is not part of the operating architecture yet.

## Registries

| Registry | File | Purpose |
|---|---|---|
| Product Ladder | `lib/platform/product-ladder-registry.ts` | Every product surface in the governed sequence |
| Canonical Records | `lib/platform/canonical-record-registry.ts` | Every persisted record type |
| Admin Domains | `lib/platform/admin-domain-registry.ts` | Every admin route with domain/role/risk |
| Operating Spine | `lib/platform/operating-spine-registry.ts` | Full lifecycle mapping for each surface |
| Governance Events | `lib/platform/governance-event-types.ts` | Shared event vocabulary |
| Governance Event Bus | `lib/platform/governance-event-bus.ts` | Event emission with validation |

## Product Ladder

The canonical product ladder (one governed sequence):

1. Public essays/editorials/intelligence surfaces
2. Free/entry diagnostics (Fast Diagnostic)
3. Purpose Alignment
4. Constitutional Diagnostic
5. Executive Reporting
6. Strategy Room
7. Boardroom Mode
8. Enterprise Decision Authority
9. Retainer Oversight
10. GMI / Market Intelligence
11. Outbound / Publication / Category Formation

## Admin Operating Structure

The admin area is an Operator Console with seven domains:

| Domain | Purpose |
|---|---|
| Command Centre | Global lock, health, active risks, intake, security state |
| Product Operations | Diagnostics, reports, rooms, boardroom, enterprise |
| Intelligence Foundry | Research runs, simulations, red-team, adapter health |
| Content & Editorial | Editorials, essays, outbound drafts, style checks |
| Outbound Publishing | Facebook, X, LinkedIn, sync state, publish attempts |
| Access & Entitlements | Users, access tiers, Inner Circle, product grants |
| Audit & Lineage | System audit, report lineage, Foundry audit, security audit |

## Intelligence Foundry Integration

Every Foundry module links to protected product surface(s):

- Fast Diagnostic → Fast Diagnostic surface
- Constitutional Diagnostic → Constitutional Diagnostic surface
- Executive Reporting → Executive Reporting surface
- Strategy Room → Strategy Room surface
- Boardroom Mode → Boardroom Mode surface
- Outbound Content Validator → Outbound Publishing surfaces
- Editorial Style Checker → Content surfaces
- GMI → Market Intelligence surface

## Governance Event Bus (Live — Pass 3B)

The GovernanceEvent bus is now wired into real platform flows. Every wired flow emits standardised events into audit, lineage, and Foundry improvement flows.

**Wired flows:**
- ResearchRun lifecycle (Foundry) — RESEARCH_RUN_CREATED, FINDING_CREATED, FOUNDRY_ACTION_REQUIRED, etc.
- ER → Boardroom bridge simulation — simulation-scoped events with `simulation: true` payload
- Outbound publishing — OUTBOUND_PUBLISHED, OUTBOUND_FAILED, OUTBOUND_POLICY_CHECKED, etc.
- Content/editorial checks — CONTENT_STYLE_CHECKED, CONTENT_METADATA_VALIDATED, CONTENT_OUTBOUND_ELIGIBLE
- GMI release events — GMI_QUALITY_GATE_RUN, GMI_RELEASE_PUBLISHED, GMI_CALL_CARRIED_FORWARD, etc.

**Routing behaviour:**
- `shouldWriteAudit = true` → writes audit event
- `shouldWriteLineage = true` → writes lineage event
- `shouldCreateResearchRun = true` → creates ResearchRun + FoundryFinding

**Result types:** RECORDED / PARTIAL / FAILED — no silent event drops.

See `docs/architecture/live-governance-event-wiring.md` for full details.

## Report Lineage Simulation

Report Lineage Simulation is the first runtime proof of the governed product operating architecture. Implemented in `lib/research/lineage/`.

Seven lineage chains are defined and validated against the Pass 1 registries. All 7 are now **COMPLETE** after Pass 3A vocabulary closure.

| Chain | Events | Status |
|---|---|---|
| Executive Reporting | STARTED → GENERATED → REVIEWED → EXPORTED → REVOKED | **COMPLETE** |
| ER → Boardroom | GENERATED → MAPPED → QUALIFIED → PREVIEWED → EXPORTED | **COMPLETE** |
| Strategy Room | OPENED → REVIEWED → DIRECTIVE → ESCALATION → ACTION | **COMPLETE** |
| Outbound Publishing | DRAFT → POLICY → APPROVED → PUBLISHED → SYNCED → FAILED | **COMPLETE** |
| Foundry ResearchRun | CREATED → FINDING → BRIEF → FOUNDRY_ACTION → IMPLEMENTED → ARCHIVED | **COMPLETE** |
| Content / Editorial | CREATED → STYLE → METADATA → PUBLISHED → OUTBOUND | **COMPLETE** |
| GMI Release | DRAFTED → REVIEWED → GATE → APPROVED → PUBLISHED → CARRIED | **COMPLETE** |

Each simulated event validates against:
- `product-ladder-registry.ts` — source surface exists
- `canonical-record-registry.ts` — canonical record exists
- `admin-domain-registry.ts` — admin owner route exists
- `governance-event-types.ts` — governance event exists

Missing registry links create source-backed gaps. HIGH/CRITICAL gaps become FoundryFindings. The simulation can optionally create ResearchRuns.

API: `POST /api/admin/intelligence-foundry/lineage/simulate`
Page: `/admin/intelligence-foundry/simulation/report-lineage`
Docs: `docs/architecture/report-lineage-simulation.md`

## Product Health Dashboard

The Product Health Dashboard exposes integration gaps:

- GREEN: integrated and tested
- AMBER: partial coverage
- RED: missing owner / missing record / missing audit / missing Foundry test
- GREY: planned or retired
