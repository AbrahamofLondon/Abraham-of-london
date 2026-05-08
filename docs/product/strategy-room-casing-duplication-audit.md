# Strategy Room Casing / Duplication Audit

**Date:** 2026-05-07

---

## Directories

| Path | File count | Active imports | Status |
|------|-----------|---------------|--------|
| `components/strategy-room/` (lowercase) | 17 | 14 import statements across 4 consuming files | CANONICAL — all active code uses this path |
| `components/StrategyRoom/` (PascalCase) | 2 | 0 | ORPHANED — zero imports anywhere in codebase |

## Duplicate Form files

| File | Purpose | Imported | Status |
|------|---------|----------|--------|
| `components/strategy-room/Form.tsx` | Multi-stage form with scoring model | Possibly (via index barrel) | ACTIVE |
| `components/StrategyRoom/Form.tsx` | Framer Motion form with router safety | NO — zero imports | DEAD CODE |
| `components/StrategyRoom/IntakeForm.tsx` | Router-safe intake form | NO — zero imports | DEAD CODE |

## Import map

All active imports use lowercase `@/components/strategy-room`:

| Consuming file | Components imported |
|----------------|-------------------|
| `pages/strategy-room/index.tsx` | DecisionStateBanner, DynamicConsequencePanel, EscalationTriggerPanel, AvoidancePatternNotice, RetainerEntryGate, AdvantagePathBlock, AIInterventionSuggestions, ExecutionFlow |
| `pages/strategy-room/session/[id].tsx` | ReturnBriefInterruptionBar |
| `pages/diagnostics/executive-reporting/run.tsx` | AdvantagePathBlock, RetainerEntryGate, StrategyRoomConversionBridge |
| `components/strategy-room/ConstitutionalResultSurface.tsx` | ConstitutionalFollowupPanel |

## Linux/Netlify case-sensitivity risk

**Risk level: LOW but present.** Windows/macOS resolve both paths to the same directory. Linux (Netlify builds) treats them as distinct. Since zero imports use the PascalCase path, the orphaned directory poses no active build risk. However, its existence is confusing.

## Safest consolidation path

1. Confirm `components/StrategyRoom/` has zero references in any config, barrel, or dynamic import
2. Delete `components/StrategyRoom/` directory (2 files, zero consumers)
3. No import changes required — all active code already uses lowercase

**This change is trivially safe.** Awaiting explicit approval before deletion.
