# Known Gap Closure Register

> Date: 2026-05-08
> Purpose: Canonical register of every known gap across the product ladder.
> Standard: No gap may be called closed unless lifecycle is proven.

---

## Evidence Memory Gaps

| # | Gap | Current Status | Priority |
|---|-----|---------------|----------|
| 1 | Team -> Return Brief source join | CERTIFIED_CLOSED (organisationId / sponsorUserId) | Done |
| 2 | Team -> Oversight Brief source join | CERTIFIED_CLOSED (organisationId / sponsorUserId) | Done |
| 3 | Enterprise -> Return Brief source join | CERTIFIED_CLOSED (organisationId with membership fallback) | Done |
| 4 | Enterprise -> Oversight Brief source join | CERTIFIED_CLOSED (organisationId direct) | Done |
| 5 | Consequence evidence -> Return Brief | CERTIFIED_CLOSED (canonical snapshot direct) | Done |
| 6 | Retainer Intake -> Oversight/Admin/Client | CERTIFIED_CLOSED (email/userId direct) | Done |

## UX Gaps

| # | Gap | Current Status | Priority |
|---|-----|---------------|----------|
| 7 | Fast Diagnostic result-page hierarchy | CONFIRMED_OPEN — too many blocks, weak "so what" | P1 |
| 8 | PA framing sounds self-help | PARTIALLY_CLOSED — eyebrow updated, core framing already strong | P2 |
| 9 | Constitutional naming opaque | PARTIALLY_CLOSED — behavioural hook added to subtitle | P2 |
| 10 | Strategy Room entry transition | CONFIRMED_OPEN — user arrives at dense evidence, no guided start | P1 |
| 11 | Strategy Room session next-action | CONFIRMED_OPEN — active sessions read like documents | P1 |
| 12 | Return Brief "no brief" dead-end | CERTIFIED_CLOSED — now shows governed monitoring with trigger list | Done |
| 13 | Decision Centre prioritisation | CONFIRMED_OPEN — cases render without priority hierarchy | P1 |
| 14 | Oversight Brief language density | SURFACED_BUT_WEAK_UX — data renders but cross-reference is generic | P2 |

## Operational Gaps

| # | Gap | Current Status | Priority |
|---|-----|---------------|----------|
| 15 | Counsel workflow states | CONFIRMED_OPEN — admin surface exists but no formal lifecycle states | P1 |
| 16 | Boardroom Mode delivery route | NEEDS_SCHEMA_JOIN_VERIFICATION — PDF export exists but functional status unverified | P1 |
| 17 | Commitment checkpoint user confirmation | PARTIALLY_CLOSED — SR execution has buttons, Return Brief is display-only | P2 |
| 18 | Control Room sponsor-safe consumer | PARTIALLY_CLOSED — control room loader exists, enterprise surface unclear | P2 |

## Schema/Architecture Gaps

| # | Gap | Current Status | Priority |
|---|-----|---------------|----------|
| 19 | `as any` masking schema joins | NEEDS_SCHEMA_JOIN_VERIFICATION — prisma dynamic access used extensively | P1 |
| 20 | TeamAssessmentCampaign missing @relation to Organisation | CONFIRMED_OPEN — organisationId field exists, no Prisma relation | P2 |
| 21 | Financial exposure persistence consumers | PARTIALLY_CLOSED — persisted, loaded in some surfaces | P2 |
| 22 | Cross-ladder memory consistency | PARTIALLY_CLOSED — core chains work, edge cases untested | P2 |

## IP/Trust Gaps

| # | Gap | Current Status | Priority |
|---|-----|---------------|----------|
| 23 | Proof layer public evidence standard | CERTIFIED_CLOSED (Part 15 validation passed) | Done |
| 24 | Product-surface IP overexposure | PARTIALLY_CLOSED — standards page declares redaction, individual surfaces need scan | P2 |
| 25 | Hero/header collision and layout | INTERNAL_ONLY_OK — design concern, not evidence gap | P3 |

## Question Layer Gaps

| # | Gap | Current Status | Priority |
|---|-----|---------------|----------|
| 26 | Purpose Alignment signal phase length (18 questions) | SURFACED_BUT_WEAK_UX — consider reducing to 14 | P3 |
| 27 | Enterprise Likert 12 questions untouched | CONFIRMED_OPEN — not audited against current quality bar | P2 |
| 28 | Strategy Room Stage 2 slider defaults | PARTIALLY_CLOSED — text evidence fields added, defaults still 5 | P3 |

---

## Summary

| Status | Count |
|--------|-------|
| CERTIFIED_CLOSED | 7 |
| PARTIALLY_CLOSED | 8 |
| CONFIRMED_OPEN | 6 |
| NEEDS_SCHEMA_JOIN_VERIFICATION | 2 |
| SURFACED_BUT_WEAK_UX | 2 |
| INTERNAL_ONLY_OK | 1 |
| RETIRED | 0 |
| **Total** | **26** |
