---
title: Intelligence Briefs — Editorial Calendar
type: editorial
status: internal
---

# Intelligence Briefs — Editorial Calendar

**Canonical series count:** 25 Institutional Alpha · 25 Sovereign Intelligence · 50 total
**Launch date:** 2026-06-11 (Thursday)
**Cadence:** S1 launch (8), then 2/week Thursdays through Week 8, then 1/week Thursdays
**Scheduling decision:** Manual — editor promotes `publicationStatus: scheduled` → `published` each week, or runs `pnpm exec node scripts/promote-scheduled-briefs.mjs`

---

## Season 1 — Launch (2026-06-11) — 8 briefs

| # | ID | Title | Series |
|---|---|---|---|
| 1 | IA-003 | The Hidden Cost of Flattering Data | Institutional Alpha |
| 2 | IA-021 | Why Executive Summaries Mislead | Institutional Alpha |
| 3 | IA-045 | Why Leaders Stop Hearing Reality | Institutional Alpha |
| 4 | IA-069 | When the Board Sees a Different Company | Institutional Alpha |
| 5 | SI-002 | Dependence Disguised as Partnership | Sovereign Intelligence |
| 6 | SI-017 | Alignment Without Sovereignty | Sovereign Intelligence |
| 7 | SI-038 | The Vulnerability of Narrative Capture | Sovereign Intelligence |
| 8 | SI-065 | Why Power Concentrates Around the Decisive | Sovereign Intelligence |

---

## Season 2 — Weeks 1–8 (2026-06-18 → 2026-08-13) — 2 briefs/week

| Week | Date | Briefs |
|---|---|---|
| 1 | 2026-06-18 | IA-015 Intelligence After the Founder Myth · SI-008 When Optionality Quietly Dies |
| 2 | 2026-06-25 | IA-027 The Politics of Suppressed Bad News · SI-041 When Institutions Become Too Easy to Pressure |
| 3 | 2026-07-02 | IA-060 Reporting Systems That Reward Optimism · SI-029 Pricing Power as a Test of Institutional Freedom |
| 4 | 2026-07-09 | IA-042 Intelligence Debt in Scaling Firms · SI-014 The Geography of Hidden Influence |
| 5 | 2026-07-16 | IA-075 The Discipline of Decision-Grade Intelligence · SI-074 The Discipline of Institutional Self-Government |
| 6 | 2026-07-23 | IA-033 Overinterpreting Motion as Momentum · SI-020 The Tax of Strategic Appeasement |
| 7 | 2026-07-30 | IA-006 When Dashboards Outpace Judgment · SI-047 The Strategic Risk of Needing Everyone to Like You |
| 8 | 2026-08-06 | IA-009 The Blindness of Clean Narratives · SI-005 The Cost of Borrowed Legitimacy |

*(Week 8 second date extends to 2026-08-13 for the second brief)*

---

## Season 3 — Ongoing (2026-08-20 → 2026-11-05) — 1 brief/week

| Week | Date | Brief |
|---|---|---|
| 9 | 2026-08-20 | IA-013 When Risk Travels Faster Than Reporting |
| 10 | 2026-08-27 | SI-040 Control Without Ownership |
| 11 | 2026-09-03 | IA-014 False Confidence from Aggregated Metrics |
| 12 | 2026-09-10 | SI-039 Fragile Autonomy in Capital-Dependent Firms |
| 13 | 2026-09-17 | IA-012 Signal Decay in Reporting Chains |
| 14 | 2026-09-24 | SI-044 Sovereignty at the Edge of Regulation |
| 15 | 2026-10-01 | IA-018 The Comfort of Lagging Indicators |
| 16 | 2026-10-08 | SI-056 The Price of Letting Others Set Your Time Horizon |
| 17 | 2026-10-15 | IA-030 Pattern Recognition Without Operating Truth |
| 18 | 2026-10-22 | SI-041 Identity Drift in Institutions Under External Pressure |
| 19 | 2026-10-29 | IA-036 The Institutional Price of Guesswork |
| 20 | 2026-11-05 | SI-050 Internal Empires and the Loss of Common Rule |

*(Remaining S3 briefs continue past 2026-11-05 at the same Thursday cadence)*

---

## Scheduling decision: Manual with script assist

**Default:** Editor runs the promote script the morning of each release Thursday:

```bash
pnpm exec node scripts/promote-scheduled-briefs.mjs --dry-run   # preview
pnpm exec node scripts/promote-scheduled-briefs.mjs              # apply
```

The script promotes any brief where `scheduledFor <= today` and `publicationStatus: scheduled`.
It does not touch `editorial-hold` briefs.
After running, editor rebuilds the registry: `pnpm exec node scripts/generate-briefs-registry.mjs` (requires contentlayer output).

**Never automate registry promotion in CI without a dry-run review gate.**

---

## Release checklist (each Thursday)

- [ ] Run `promote-scheduled-briefs.mjs --dry-run` and verify the brief list
- [ ] Confirm brief frontmatter has no `contamination` or archive language
- [ ] Apply promotion
- [ ] Regenerate registry if contentlayer has run
- [ ] Verify brief appears at `/briefs/[slug]`
- [ ] Share to Inner Circle preview channel if applicable
