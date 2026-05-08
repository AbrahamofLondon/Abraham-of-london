# Organisation Control Room UX Architecture

**Date:** 2026-05-07
**Authority:** Decision Infrastructure by Abraham of London
**Route:** `/control-room` or `/organisation/[slug]/control-room`
**Audience:** Team/enterprise sponsors

---

## Purpose

The Control Room is for organisation sponsors who commission team and enterprise assessments. It shows governed organisational state — not generic analytics.

---

## Sections

### 1. Current State
- Organisation name, sector, size band
- Active campaigns count
- Total respondents
- Aggregated evidence tier
- Unresolved contradictions
- Latest divergence pattern
- Admission readiness (can the org commission ER? Strategy Room?)

### 2. Campaigns
List all campaigns with:
- Title, type (team/enterprise), status
- Respondent completion (X/Y completed)
- Completion threshold met? (Yes/No)
- Aggregation status
- Latest divergence signal
- CTA: View results / Send reminders / Close campaign

### 3. Divergence Map
Visual or list view of:
- Domains where leadership and respondent signals disagree
- Gap severity per domain
- Cross-campaign divergence (if multiple campaigns)
- Contradiction persistence (repeated across campaigns)

### 4. Evidence
- Evidence tier per campaign
- Evidence nodes by stage
- Contradiction count and severity
- Evidence strength checklist (which stages are complete org-wide)

### 5. Admissions
- Executive Reporting: org-level admissibility
- Strategy Room: org-level admissibility
- Restriction reasons if not admissible
- Repair actions

### 6. Interventions
- Active Strategy Room sessions linked to organisation
- Intervention stack
- Execution status

### 7. Outcomes
- Outcome verification queue
- Verified outcomes with classification
- Return Brief availability

### 8. Memory
- Decision credit (org-level aggregation)
- Pattern recurrence across campaigns
- Institutional learning signals

---

## Data Source

Server-authoritative. Derived from:
- `Organisation` → `AlignmentCampaign` → responses, aggregates, snapshots
- `DiagnosticJourney` records with matching `organisationKey`
- `RetainerContract` for contracted organisations
- Campaign-level admission evaluation

---

## Privacy enforcement

Sponsor sees:
- Aggregated signals (always)
- Individual identity (named mode campaigns only)
- Raw response content (never — always aggregated)
- Completion status per respondent (yes)
- Outcome classifications (yes)

Sponsor does not see:
- Individual response scores in anonymous mode
- Raw text answers
- Individual respondent contradictions
