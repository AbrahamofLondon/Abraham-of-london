# Advantage Activation Roadmap

**Date:** 9 May 2026
**Purpose:** Rank every opportunity by strategic value, execution difficulty, and commercial impact.

---

## P0 — Market-Defining (Build Now)

These make the product visibly different and create category-defining moats.

| # | Opportunity | Strategic Value | Effort | Files | Dependencies |
|---|-------------|----------------|--------|-------|-------------|
| 1 | Decision Velocity Score | CATEGORY-DEFINING | Medium | New `lib/analytics/decision-velocity.ts`, `pages/diagnostics/fast.tsx`, `pages/decision-centre.tsx` | Checkpoint system (exists) |
| 2 | What Changed Dashboard | CATEGORY-DEFINING | Medium | New `pages/intelligence/what-changed.tsx`, `lib/analytics/comparison-engine.ts` | Evidence spine (exists) |
| 3 | Contradiction Map (user-safe) | CATEGORY-DEFINING | High | New `pages/intelligence/contradiction-map.tsx`, new `components/graph/ContradictionMap.tsx` | Contradiction graph (exists) |
| 4 | Executive Reporting Compression | HIGH | Medium | `pages/diagnostics/executive-reporting/run.tsx` — `ResultSurface` | None |
| 5 | Boardroom Standalone Page | CATEGORY-DEFINING | High | New `pages/boardroom/[sessionId].tsx`, PDF export enhancement | Boardroom engine (exists) |
| 6 | Return Brief Email Delivery | HIGH | Medium | New email template, trigger service integration | Return Brief (exists) |
| 7 | Outcome Verification Loop | CATEGORY-DEFINING | High | Check-in flow at 14/30/60/90 days, email + in-app | Checkpoint system (exists) |

**Total P0 effort:** High (multiple workstreams)
**Recommendation:** Execute in parallel where possible. Decision Velocity and What Changed share data sources.

---

## P1 — Retention & Pricing Power (Build Next)

These increase retention, justify pricing tiers, and create switching costs.

| # | Opportunity | Strategic Value | Effort | Files | Dependencies |
|---|-------------|----------------|--------|-------|-------------|
| 8 | Purpose Alignment Trend | HIGH | Low | New `components/alignment/AlignmentTrendChart.tsx`, `pages/diagnostics/purpose-alignment.tsx` | PA evidence loader (exists) |
| 9 | Arbiter Trust Badge | HIGH | Low | New `components/trust/ArbiterBadge.tsx`, `pages/diagnostics/fast.tsx` | Arbiter tournament (exists) |
| 10 | Irreversibility in Decision Centre | HIGH | Medium | `pages/decision-centre.tsx`, `pages/diagnostics/executive-reporting/run.tsx` | Irreversibility index (exists) |
| 11 | Counsel Case Status Tracking | HIGH | Low | New `pages/counsel/status.tsx`, notification service | Counsel case service (exists) |
| 12 | Proof Pack Generation | HIGH | Medium | New `lib/product/proof-pack-generator.ts`, new PDF template | Evidence spine (exists) |
| 13 | Institutional Memory Page | HIGH | Medium | New `pages/intelligence/memory.tsx`, `lib/analytics/pattern-aggregation.ts` | Evidence spine (exists) |
| 14 | Cross-Assessment Intelligence | HIGH | Medium | New surface integration, `lib/decision/kernel.ts` | Kernel (exists) |

**Total P1 effort:** Medium
**Recommendation:** Build in order of dependency. Arbiter badge and PA trend are quick wins.

---

## P2 — Enterprise Moat (Build When Capacity Allows)

These create enterprise-grade defensibility and multi-tenant capabilities.

| # | Opportunity | Strategic Value | Effort | Files | Dependencies |
|---|-------------|----------------|--------|-------|-------------|
| 15 | Portfolio Dashboard | MEDIUM | Medium | New operator dashboard | Portfolio memory (exists) |
| 16 | Organisation Divergence in ER | MEDIUM | Medium | `pages/diagnostics/executive-reporting/run.tsx` | Divergence summary (exists) |
| 17 | Anonymised Benchmarking | HIGH | High | New benchmark queries, surface integration | User base required |
| 18 | Operator Command Centre | MEDIUM | Medium | New `pages/admin/command-centre.tsx` | Counsel service (exists) |
| 19 | Decision Centre Priority | HIGH | Medium | `pages/api/decision-centre/cases.ts`, `pages/decision-centre.tsx` | Checkpoint system (exists) |
| 20 | Data Export + Switching Cost | HIGH | Medium | New `pages/account/export.tsx`, `lib/product/data-export-service.ts` | Evidence spine (exists) |

**Total P2 effort:** Medium-High
**Recommendation:** Prioritise Decision Centre priority and data export — these directly impact retention.

---

## P3 — Future (Low Priority)

These are valuable but depend on maturity of other systems.

| # | Opportunity | Strategic Value | Effort | Dependencies |
|---|-------------|----------------|--------|-------------|
| 21 | Outcome-Based Pricing | CATEGORY-DEFINING (future) | Very High | Mature outcome verification |
| 22 | Self-Deception Index | MEDIUM | Low | PA engine (exists) |
| 23 | Commitment Reliability Score | MEDIUM | Low | Checkpoint system (exists) |
| 24 | Boardroom Readiness Score | MEDIUM | Low | Boardroom engine (exists) |
| 25 | One-Click Team Invite | MEDIUM | Medium | Campaign system (exists) |
| 26 | External Integrations | MEDIUM | High | Integration service layer |
| 27 | Anonymised Case Study Pipeline | MEDIUM | High | Outcome verification maturity |

---

## Execution Sequence

### Sprint 1 (Weeks 1-2)
1. **Decision Velocity Score** — compute from checkpoint timestamps, surface in Fast Diagnostic result + Decision Centre
2. **Arbiter Trust Badge** — surface "quality checks passed" on Fast Diagnostic result
3. **Purpose Alignment Trend** — add coherence band movement chart

### Sprint 2 (Weeks 3-4)
4. **What Changed Dashboard** — compare current vs previous state across all dimensions
5. **Executive Reporting Compression** — 18 blocks → 7 sections
6. **Irreversibility in Decision Centre** — add irreversibility score to case cards

### Sprint 3 (Weeks 5-6)
7. **Cross-Assessment Intelligence** — surface contradictions between PA and Constitutional
8. **Counsel Case Status** — add status tracking page for users
9. **Decision Centre Priority** — add cross-case prioritisation

### Sprint 4 (Weeks 7-8)
10. **Return Brief Email Delivery** — email delivery with one-click response
11. **Proof Pack** — downloadable evidence summary
12. **Institutional Memory Page** — aggregated patterns across sessions

### Sprint 5 (Weeks 9-10)
13. **Contradiction Map** — user-safe interactive contradiction visualisation
14. **Boardroom Standalone Page** — with PDF download

### Sprint 6 (Weeks 11-12)
15. **Outcome Verification Loop** — check-in flow at 14/30/60/90 days
16. **Data Export + Switching Cost** — export page with "what you would lose"

---

## Commercial Impact Estimate

| Opportunity | Revenue Impact | Retention Impact | Moat Impact |
|-------------|---------------|-----------------|-------------|
| Decision Velocity | HIGH (paid tier justification) | HIGH | CATEGORY-DEFINING |
| What Changed | MEDIUM | VERY HIGH | HIGH |
| Contradiction Map | MEDIUM | HIGH | CATEGORY-DEFINING |
| Executive Reporting Compression | HIGH (conversion) | MEDIUM | MEDIUM |
| Boardroom Standalone | HIGH (new product) | HIGH | CATEGORY-DEFINING |
| Return Brief Email | MEDIUM | VERY HIGH | HIGH |
| Outcome Verification | VERY HIGH (pricing leverage) | VERY HIGH | CATEGORY-DEFINING |
| Proof Pack | MEDIUM | HIGH | MEDIUM |
| Institutional Memory | MEDIUM | VERY HIGH | HIGH |
| Cross-Assessment Intelligence | MEDIUM | HIGH | HIGH |
