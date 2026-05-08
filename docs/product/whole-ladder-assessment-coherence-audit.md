# Whole-Ladder Assessment Coherence Audit

> Date: 2026-05-08
> Status: AUDIT ONLY — no code changes
> Central principle: Coherence without sameness

---

## PART 1 — FULL SURFACE INVENTORY

### Tier 1: Core Assessment Surfaces (User-Facing, Evidence-Producing)

| # | Surface | File | Questions | Rehabilitated? | Classification |
|---|---------|------|-----------|---------------|---------------|
| 1 | Fast Diagnostic | `pages/diagnostics/fast.tsx` | 3 + 1 commitment | YES — PROTECT | PROTECT |
| 2 | Purpose Alignment (context) | `lib/alignment/PurposeAlignmentAssessment.tsx` | 3 context questions | YES — PROTECT | PROTECT |
| 3 | Purpose Alignment (signals) | `lib/alignment/checklist.ts` | 18 dual-axis | YES — cleaned this pass | PROTECT |
| 4 | Constitutional Diagnostic | `lib/diagnostics/constitutional-diagnostic-derivation.ts` | 10 dual-axis | YES — q5/q9 fixed | PROTECT |
| 5 | Team Assessment (leader) | `pages/diagnostics/team-assessment.tsx` | 24 dual-axis (12x2 phases) | PARTIAL — structure strong, 1 weak statement | MINOR_REWRITE |
| 6 | Team Assessment (respondent) | `app/assessment/[token]/page.tsx` | 8 (expanded from 4) | YES — rebuilt this pass | PROTECT |
| 7 | Enterprise Assessment (leader boolean) | `lib/alignment/enterprise-checklist.ts` | 18 boolean | PARTIAL — 4 weak statements remain | MINOR_REWRITE |
| 8 | Enterprise Assessment (respondent) | `app/assessment/[token]/page.tsx` | 5 boolean | YES — rebuilt this pass | PROTECT |
| 9 | Enterprise Assessment (Likert) | `pages/diagnostics/enterprise-assessment.tsx` | 12 Likert | NOT TOUCHED | EVIDENCE_BRIDGE_NEEDED |
| 10 | Executive Reporting intake | `pages/diagnostics/executive-reporting/run.tsx` | 4 core + 1 verification + 6 selects | YES — verification anchor added | MINOR_REWRITE (sequence) |
| 11 | Strategy Room intake | `components/strategy-room/Form.tsx` | 16 fields across 4 stages | NOT TOUCHED | STRUCTURAL_REWRITE (Stage 2) |
| 12 | Strategy Room execution | `pages/strategy-room/session/[id].tsx` | 1 text + 3 status buttons | NOT TOUCHED | MINOR_REWRITE |

### Tier 2: Governed Response Surfaces (System-Generated, User-Confronting)

| # | Surface | File | Prompts | Rehabilitated? | Classification |
|---|---------|------|---------|---------------|---------------|
| 13 | Return Brief | `app/briefing/return/[sessionId]/page.tsx` | 5 trigger-driven challenges | YES — PROTECT | DOWNSTREAM_CONSUMPTION_NEEDED |
| 14 | Outcome Verification | `components/diagnostics/results/OutcomeVerification.tsx` | 6 classification-driven sections | NOT TOUCHED (display-only) | DOWNSTREAM_CONSUMPTION_NEEDED |
| 15 | Commitment Verification | `lib/product/commitment-verification.ts` | 4 checkpoint prompts | NOT TOUCHED (display-only) | DOWNSTREAM_CONSUMPTION_NEEDED |

### Tier 3: Operator/Admin Surfaces (Premium-Adjacent)

| # | Surface | File | Fields | Rehabilitated? | Classification |
|---|---------|------|--------|---------------|---------------|
| 16 | Oversight Review Bench | `pages/admin/oversight-review.tsx` | 9 inputs + 3 counsel handoff | NOT TOUCHED | STRUCTURAL_REWRITE |
| 17 | Counsel Review Workflow | `pages/admin/counsel-review.tsx` | 10 auto-generated inputs | NOT TOUCHED | NEW_QUESTION_SET_REQUIRED |
| 18 | Admin Oversight delivery | `pages/admin/oversight-review.tsx` (delivery section) | 1 select | NOT TOUCHED | MINOR_REWRITE |

### Tier 4: Trust/Entitlement Surfaces

| # | Surface | File | Fields | Rehabilitated? | Classification |
|---|---------|------|--------|---------------|---------------|
| 19 | Access Key Redemption | `pages/access/redeem.tsx` | 1 key input | NOT TOUCHED (already strong) | PROTECT |
| 20 | Organisation Setup | `app/admin/organisations/new/page.tsx` | 4 fields | NOT TOUCHED | MINOR_REWRITE |
| 21 | Campaign Creation | `app/admin/organisations/.../campaigns/new/page.tsx` | 3 fields + email list | NOT TOUCHED | MINOR_REWRITE |

### Tier 5: Bridge/Architecture Layers

| # | Surface | File | Rehabilitated? | Classification |
|---|---------|------|---------------|---------------|
| 22 | Constitutional Bridge (scores) | `lib/diagnostics/constitutional-bridge.ts` | NOT TOUCHED | — (existing, functional) |
| 23 | Constitutional Evidence Bridge | `lib/diagnostics/constitutional-evidence-bridge.ts` | YES — created this pass | PROTECT |
| 24 | Purpose Alignment downstream | (no dedicated bridge file) | NOT TOUCHED | EVIDENCE_BRIDGE_NEEDED |
| 25 | Fast Diagnostic downstream | (persists via session/localStorage) | NOT TOUCHED | EVIDENCE_BRIDGE_NEEDED |

---

## PART 2 — REHABILITATION STATUS

### Fully rehabilitated (8 surfaces)
1. Fast Diagnostic — all 4 questions PROTECT
2. Purpose Alignment context — 3 questions PROTECT
3. Purpose Alignment signals — 18 questions cleaned (8 rewritten/replaced)
4. Constitutional Diagnostic — q5/q9 rewritten, evidence bridge created
5. Team respondent — expanded to 8 domains, all rewritten
6. Enterprise respondent — all 5 questions replaced
7. Executive Reporting — verification anchor added
8. Access Redemption — already strong

### Partially rehabilitated (4 surfaces)
9. Team leader — structure strong, "produces visible progress" still weak
10. Enterprise leader boolean — 4 weak statements remain (mc_3, di_1, eco_2 + redundancy in od_2/od_3/lco_1)
11. Return Brief — prompts are strong, but does not consume avoidedDecision or costOfDelay
12. Constitutional bridge — evidence bridge created but upstream context not yet populated by callers

### Not rehabilitated (9 surfaces)
13. Enterprise Likert (12 questions) — untouched
14. Strategy Room intake Stage 2 — sliders still allow default evasion
15. Strategy Room execution — status controls unexplained
16. Outcome Verification — display-only, no user verification input
17. Commitment Verification — display-only, disconnected from verification criteria
18. Oversight Review Bench — operator decisions lack guidance
19. Counsel Review Workflow — auto-generated CRUD form, weakest surface in product
20. Organisation Setup — adequate but sector field weak
21. Campaign Creation — adequate but cadence/close-date unexplained

---

## Summary Counts

| Status | Count |
|--------|-------|
| PROTECT | 8 |
| MINOR_REWRITE | 5 |
| STRUCTURAL_REWRITE | 2 |
| EVIDENCE_BRIDGE_NEEDED | 3 |
| DOWNSTREAM_CONSUMPTION_NEEDED | 3 |
| NEW_QUESTION_SET_REQUIRED | 1 |
| Total surfaces audited | **21 + 4 bridge layers = 25** |
