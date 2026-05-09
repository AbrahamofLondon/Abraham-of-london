# Competitive Defensibility Register

**Date:** 9 May 2026
**Purpose:** Classify every advantage by defensibility level and identify which ones need hardening.

---

## Defensibility Levels

| Level | Meaning | Count |
|-------|---------|-------|
| ACQUISITION_LEVEL | Easier to partner/buy than replicate | 3 |
| VERY_HIGH | Requires system architecture, data continuity, workflow adoption | 4 |
| HIGH | Requires decent engineering but no proprietary data | 5 |
| MEDIUM | Requires moderate engineering effort | 5 |
| LOW | Cosmetic or easily copyable | 3 |

---

## ACQUISITION_LEVEL Advantages

These are the core moats. If a serious competitor saw these, they would rather acquire than compete.

| Advantage | Why | Risk if copied |
|-----------|-----|----------------|
| Evidence Spine | 80 fields across 8 stages with source-labelled rendering. Years of architecture work. | Low — cannot be replicated quickly |
| Contradiction Graph | Temporal, cross-assessment, decay-aware. Accumulated data is unique per user. | Low — data cannot be replicated |
| Decision Kernel | Self-auditing, bias-correcting, prediction-accountable. Requires accumulated outcome pairs. | Low — cannot be bootstrapped |

**Hardening priority:** Ensure these remain server-only. Never expose internal mechanics. Surface only the output.

---

## VERY_HIGH Defensibility Advantages

| Advantage | Why | Risk if copied |
|-----------|-----|----------------|
| Strategy Room | Requires full ladder, checkpoint system, evidence spine, enforcement state | Medium — would take 6-12 months to replicate |
| Return Brief | Requires checkpoint system, evidence spine, trigger evaluation, cost clock | Medium — would take 6-12 months |
| Oversight Brief | Requires full ladder, checkpoint system, retainer infrastructure, cycle history | Medium — would take 6-12 months |
| Checkpoint System | 7-surface integration, response classification, full lifecycle | Medium — would take 3-6 months |

**Hardening priority:** Increase surface integration. Add email delivery. Build the outcome verification loop.

---

## HIGH Defensibility Advantages

| Advantage | Why | Risk if copied |
|-----------|-----|----------------|
| Executive Reporting | Canonical report contract, 5-stage evidence inheritance, boardroom qualification | Medium — would take 3-6 months |
| Counsel Room | Evidence package prefill, escalation triggers, operator workflow | Medium — would take 3-6 months |
| Irreversibility Index | Multi-factor, multi-source data requirements | Medium — concept copyable, data is not |
| Constitutional Diagnostic | REJECT route is a genuine governance mechanism | Low — concept copyable, positioning is not |
| Decision Centre | Evidence spine, checkpoint, governed memory integration | Medium — would take 3-6 months |

**Hardening priority:** Add cross-case prioritisation. Surface irreversibility. Build counsel case status tracking.

---

## MEDIUM Defensibility Advantages

| Advantage | Why | Risk if copied |
|-----------|-----|----------------|
| Purpose Alignment | Dual-axis concept is visible, implementation is server-only | High — concept could be replicated in 30 days |
| Arbiter Tournament | Concept visible, rules server-only | High — concept could be replicated |
| Pattern Recurrence | V0 implementation, text matching | High — basic version could be replicated |
| Portfolio Memory | Multi-organisation data requirement | Medium — requires data, not architecture |
| Organisation Divergence | Multi-respondent data requirement | Medium — requires data, not architecture |

**Hardening priority:** Surface the output, not the mechanism. Build trend data to create switching cost.

---

## LOW Defensibility Advantages

| Advantage | Why | Risk if copied |
|-----------|-----|----------------|
| Fast Diagnostic | 3-question format, condition labels, synthesis | Very High — could be replicated in 30 days |
| Team Assessment | Multi-respondent survey format | Very High — could be replicated in 30 days |
| Enterprise Assessment | Assessment structure | High — could be replicated in 60 days |

**Hardening priority:** These are entry points. Their defensibility comes from integration with higher layers, not from their standalone value.

---

## Defensibility Improvement Roadmap

| Current Level | Target Level | Action |
|--------------|-------------|--------|
| MEDIUM → HIGH | Purpose Alignment | Add trend tracking, cross-assessment contradiction surfacing |
| MEDIUM → HIGH | Arbiter Tournament | Surface as trust badge, keep rules hidden |
| MEDIUM → HIGH | Pattern Recurrence | Add frequency dashboard, cross-session aggregation |
| LOW → MEDIUM | Fast Diagnostic | Deepen checkpoint integration, add decision velocity surfacing |
| LOW → MEDIUM | Team Assessment | Fix invite flow, add one-click respondent access |
| HIGH → VERY_HIGH | Executive Reporting | Compress result page, add preview mechanism |
| HIGH → VERY_HIGH | Counsel Room | Add case status tracking, notification, operator dashboard |
