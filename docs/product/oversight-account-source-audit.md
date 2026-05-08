# Oversight Account Source Audit

**Date:** 2026-05-08
**Authority:** Decision Infrastructure by Abraham of London

## Purpose

This audit identifies which existing sources can support a real monthly oversight brief without inventing a parallel retainer model.

## Source Classification

| Source | Status | Current purpose | Safe for v0 monthly oversight? | Risk | Recommended role |
|---|---|---|---|---|---|
| `User` + auth session | ACTIVE | Identity anchor for user-scoped continuity | Yes | Low | Canonical actor identity for user-level oversight |
| `Organisation` | ACTIVE | Canonical organisation container | Yes | Low | Canonical organisation scope for retained oversight |
| `OrganisationMembership` | ACTIVE | Role/membership authority | Yes | Low | Canonical organisation access boundary |
| `lib/product/organisation-access.ts` | ACTIVE | Access decision helper for Control Room scope | Yes | Low | Canonical membership/privacy gate before organisation oversight |
| `DiagnosticJourney` | ACTIVE | Durable case container and case history spine | Yes | Medium | Canonical case index for oversight account loading |
| `lib/product/living-case-store.ts` | PARTIAL | Single-case derivation for Living Case surfaces | Partially | Medium | Supporting source for case semantics, not the multi-case loader |
| `DiagnosticDecisionObject` | ACTIVE | Canonical decision text, cost-of-delay text, Strategy Room link | Yes | Medium | Canonical decision basis inside case summaries |
| `DiagnosticEvidenceNode` | ACTIVE | Contradictions, recurrence markers, execution records, evidence graph | Yes | Medium | Canonical contradiction/execution evidence source |
| `StrategyRoomExecutionSession` | ACTIVE | Durable Strategy Room continuity state | Yes | Medium | Canonical execution context where session link exists |
| `StrategyDecisionLog` | ACTIVE | Commitment execution status and update timing | Yes | Medium | Canonical commitment verification source |
| `lib/strategy-room/execution-record.ts` | ACTIVE | Reads latest durable execution record from evidence nodes | Yes | Low | Canonical execution record adapter for oversight checks |
| `lib/product/commitment-verification.ts` | ACTIVE | Derives due/overdue checkpoints from execution evidence | Yes | Low | Canonical checkpoint logic |
| `OutcomeVerificationRecord` | ACTIVE | Durable verified outcome movement | Yes | Low | Canonical outcome movement source |
| `lib/decision-ledger/ledger-service.ts` | ACTIVE | Aggregates decision credit profile from real contracts/outcomes | Yes | Medium | Canonical decision credit profile |
| `lib/product/decision-credit-governance.ts` | ACTIVE | Maps score/trend into governance consequence | Yes | Low | Canonical interpretation layer, not raw score source |
| `lib/product/pattern-recurrence.ts` | ACTIVE | Conservative recurrence detection across prior journeys | Yes | Medium | Canonical recurrence detector for v0 |
| `lib/constitution/boardroom-mode.ts` | PARTIAL | Boardroom threshold gate from spine economics/accuracy | Partially | Medium | Supporting threshold detector when cost basis exists |
| `RetainerContract` | ACTIVE | Durable contracted retainer state | Yes | Low | Canonical account lifecycle when contract exists |
| `RetainedDecision` + `EnforcementCycle` | PARTIAL | Existing retainer persistence for governed decisions | Partially | Medium | Supporting retained-state source, not yet monthly brief authority |
| `lib/retainers/retainer-service.ts` | PARTIAL | Contract access, retained decision operations | Partially | Medium | Supporting entitlement/access adapter |
| `Decision Centre` case cards/API | PARTIAL | User-facing single-case operating console | Partially | Low | Supporting summary heuristics, not source-of-truth |
| `Return Brief` server + page | PARTIAL | Session-level confrontation artifact | Partially | Low | Supporting cost/verification signal pattern |
| `lib/product/control-room-state-loader.ts` | PARTIAL | Privacy-safe organisation aggregate state | Partially | Medium | Supporting organisation divergence/admission context |
| `MultiStakeholderResult` | CONTRACT_ONLY | Persisted multi-user aggregate payloads | Not yet | High | Future divergence source once summarisation is hardened |
| `lib/constitution/multi-user-collision.ts` | UNSAFE | Raw collision detection asset | No | High | Keep internal only behind sponsor-safe summary wrapper |
| Admin campaign tables/pages | PARTIAL | Operator/admin campaign operations | Not yet | Medium | Supporting operator workflow only |
| Counsel trigger engine (`lib/strategy-room/counsel-trigger.ts`) | PARTIAL | Execution-stage counsel escalation logic | Partially | Medium | Supporting signal interpretation where room state can be reconstructed |

## What is real enough for v0 monthly oversight

- User identity and organisation membership are real enough to scope access.
- `DiagnosticJourney` plus `DiagnosticDecisionObject` are real enough to enumerate active cases.
- Strategy Room execution records and decision logs are real enough to derive commitment verification warnings.
- Outcome verification is real enough to emit improved/deteriorated signals.
- Decision credit is real enough to influence scrutiny interpretation.
- Retainer contracts are real enough to mark an account `ACTIVE`, `PAUSED`, or `ENDED`.

## What remains partial

- Multi-case Living Case composition is not canonical yet. `deriveLivingCase()` is still single-case oriented.
- Boardroom qualification is only safe when a real cost basis can be parsed from existing case data.
- Counsel trigger results are not durably stored as a standalone monthly oversight object.
- Organisation divergence exists contractually, but Control Room divergence remains sparse in v0.

## v0 loader rule

Oversight Account Composer must:

- load only real journeys, decisions, execution records, outcomes, and contracts
- degrade to warnings when continuity is partial
- refuse to fabricate recurrence, cost, divergence, or entitlement state
- never expose raw respondent data
