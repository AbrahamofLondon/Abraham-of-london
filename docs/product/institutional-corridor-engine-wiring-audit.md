# Institutional Corridor Engine Wiring Audit

Generated: 2026-05-10

## Engine Status

| Engine | Importers | Runtime Surfaces | Public-Safe Wrapper | Classification |
|---|---|---|---|---|
| `institutional-case-intelligence-composer.ts` | **0** | None | Self-contained | **BUILT_NOT_WIRED** |
| `institutional-case-summary.ts` | 2 | Counsel (indirect) | Type contracts | LIVE_BUT_WEAKLY_SURFACED |
| `kernel-safe-summary.ts` | 2 | Via composer contract | Type import only | CONTRACT_ONLY |
| `stakeholder-map.ts` | 3 | ER, Strategy Room (via kernel) | Via kernel evaluation | LIVE_CORRIDOR_CORE |
| `simulation-engine.ts` | 8 | ER, Strategy Room, Instruments | Via kernel.ts | LIVE_CORRIDOR_CORE |
| `kernel.ts` | 10 | ER, Strategy Room, Instruments | evaluateDecision() | LIVE_CORRIDOR_CORE |
| `contradiction-graph.ts` | 9 | ER, Strategy Room, Decision Centre | Via presenter | LIVE_CORRIDOR_CORE |
| `irreversibility-index.ts` | 4 | Institutional case, Oversight | computeIrreversibilityIndex() | LIVE_BUT_WEAKLY_SURFACED |
| `cost-of-inaction-clock.ts` | 4 | Institutional case, Oversight, Proof Pack | calculateCostOfInactionClock() | LIVE_BUT_WEAKLY_SURFACED |
| `suppression-ledger.ts` | **15** | All corridor surfaces | recordSuppression() | **LIVE_CORRIDOR_CORE** |
| `portfolio-memory-surface.ts` | 1 | Portfolio page | buildPortfolioMemory() | LIVE_CORRIDOR_CORE |
| `cross-org-pattern-intelligence.ts` | 1 | Portfolio (via memory surface) | With suppression | LIVE_CORRIDOR_CORE |
| `role-dynamic-patterns.ts` | **0** | None | N/A | **BUILT_NOT_WIRED** |
| `retained-cadence-service.ts` | 4 | Oversight, Cadence | Buyer-visible posture | LIVE_BUT_WEAKLY_SURFACED |
| `oversight-delivery-service.ts` | 1 | Oversight brief, Proof pack | queueDelivery() | LIVE_CORRIDOR_CORE |
| `proof-pack-generator.ts` | 2 | Proof Pack page | generateProofPack() | LIVE_CORRIDOR_CORE |

## Critical Findings

### BUILT_NOT_WIRED (2 engines)

1. **institutional-case-intelligence-composer.ts** — The canonical composer designed to replace local intelligence assembly across all corridor surfaces has ZERO importers. No surface page calls `composeInstitutionalCaseIntelligence()`. The contract exists but the wiring does not.

2. **role-dynamic-patterns.ts** — Complete extraction logic with 6 pattern types, sample thresholds, and thin-state handling. Zero importers. Cross-org-pattern-intelligence has a dynamic import path to it but this may not execute in practice.

### Implications

The corridor surfaces (Boardroom, Counsel, Oversight Brief, Strategy Room) currently assemble their intelligence locally rather than through the canonical composer. This means:
- No single source of truth for institutional intelligence
- Each surface may interpret evidence differently
- Suppression and thin-state handling may be inconsistent across surfaces

## Verdict

**Engine wiring: SELECTIVELY_DEFENSIBLE**

Core decision engines (kernel, simulation, contradiction graph, suppression ledger) are deeply wired. Supporting engines (irreversibility, cost-of-inaction, cadence) reach runtime but weakly. The canonical composer and role-dynamic patterns are architecturally complete but operationally disconnected.
