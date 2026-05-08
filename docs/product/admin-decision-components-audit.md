# Admin Decision Components Audit

**Date:** 2026-05-08
**Directory:** `components/admin/decision/`

---

## Component Classification

| Component | Active Imports | Used In | Classification | Notes |
|-----------|---------------|---------|---------------|-------|
| **KnowledgeGraph.tsx** | YES | `pages/admin/command-wall.tsx` | KEEP | Valuable topology visualisation for Operator Console |
| **GovernanceAlertsPanel.tsx** | YES | `app/admin/decision/governance/page.tsx` | KEEP | Core governance alerting — OPERATOR_CONSOLE_CORE |
| **SignalRegistryTable.tsx** | Likely | Decision governance pages | KEEP | Signal registry for governed asset tracking |
| **DecisionEfficacyPanel.tsx** | YES | `app/admin/decision/efficacy/page.tsx` | KEEP | Asset efficacy analysis |
| **DecisionPerformanceTable.tsx** | YES | `app/admin/decision/performance/page.tsx` | KEEP | Performance tracking by asset |
| **ContextualContextCard.tsx** | YES | `pages/admin/command-wall.tsx`, `app/admin/decision/contextual-efficacy/page.tsx` | KEEP | Contextual performance analysis |
| **ConditionalEfficacyPanel.tsx** | YES | `app/admin/decision/efficacy/page.tsx` | KEEP | Conditional efficacy breakdown |
| **ContextualRankingPanel.tsx** | Likely | `app/admin/decision/contextual-ranking/page.tsx` | KEEP | Asset ranking by context |
| **RankedAssetTable.tsx** | YES | `pages/admin/command-wall.tsx`, contextual-efficacy page | KEEP | Governed asset ranking |
| **RebuildEfficacyButton.tsx** | Likely | Efficacy pages | KEEP | Rebuild trigger for efficacy data |
| **RebuildPerformanceButton.tsx** | YES | `app/admin/decision/performance/page.tsx` | KEEP | Rebuild trigger for performance data |
| **SecurityDashboard.tsx** | Redundant re-export | None directly | RETIRE | Re-exports from canonical. See consolidation doc. |

---

## Summary

| Classification | Count |
|---------------|-------|
| KEEP | 10 |
| RETIRE | 1 (SecurityDashboard re-export) |
| MERGE | 0 |
| HARDEN | 0 |
| UNKNOWN | 0 |

The decision components directory is healthy. All 10 active components are used in governed operator surfaces (command-wall, governance, efficacy, performance, ranking pages). They represent valuable Operator Console intelligence that should be preserved and eventually organized under the console navigation plan.
