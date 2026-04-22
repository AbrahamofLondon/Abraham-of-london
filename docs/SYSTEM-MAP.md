# System Map — Single Source of Truth

Last updated: 2026-04-22
Status: LOCKED

---

## System Architecture

```
EVIDENCE          DECISION INSTRUMENTS     DIAGNOSTICS           FLAGSHIP              EXECUTION
/evidence         /decision-instruments    /diagnostics          /executive-reporting   /strategy-room
3 case dossiers   3 instruments + bundle   4-stage ladder        £95 governed brief     £395 intervention
FREE              £29–£129                 FREE                  PAID                   PAID
```

---

## Surfaces

### Tier 0 — Entry (Free)

| Route | Role | Forward Path |
|-------|------|-------------|
| `/` | System map. Positions everything. | → Diagnostics, Evidence, Instruments |
| `/evidence` | Proof layer. 3 case dossiers. | → Executive Reporting, Diagnostics, Strategy Room |
| `/evidence/[slug]` | Individual case dossier. Institutional-grade. | → System link per dossier |
| `/diagnostics` | Diagnostic ladder entry. 4 stages. | → Executive Reporting |
| `/diagnostics/constitutional-diagnostic` | Stage 1. Constitutional reading. | → Team Assessment |
| `/diagnostics/team-assessment` | Stage 2. Perception gap measurement. | → Enterprise Assessment |
| `/diagnostics/enterprise-assessment` | Stage 3. Institutional stress test. | → Executive Reporting |

### Tier 1 — Decision Instruments (Paid, £29–£129)

| Route | Role | Price | Forward Path |
|-------|------|-------|-------------|
| `/decision-instruments` | Category page (SEO/direct only, not in nav). | — | → Individual instruments |
| `/decision-instruments/decision-exposure-instrument` | Exposure quantification. | £29 | → Executive Reporting |
| `/decision-instruments/mandate-clarity-framework` | Authority mapping. | £49 | → Executive Reporting |
| `/decision-instruments/intervention-path-selector` | Action selection. | £79 | → Strategy Room |
| Bundle: Operator Decision Pack | All 3 instruments. | £129 | → Executive Reporting / Strategy Room |

### Tier 2 — Flagship (Paid, £95)

| Route | Role | Forward Path |
|-------|------|-------------|
| `/diagnostics/executive-reporting` | Entry gate + paywall. | → Executive Reporting Run |
| `/diagnostics/executive-reporting/run` | Governed executive brief generation. | → Strategy Room (if EXECUTION REQUIRED) |

### Tier 3 — Execution (Paid, £395)

| Route | Role | Forward Path |
|-------|------|-------------|
| `/strategy-room` | Psychological gate + intake. | → Execution session |
| `/strategy-room/session/[id]` | Persistent execution surface. Decision log. | → Exit: Stabilised / Monitoring / Further intervention |

### Support Surfaces

| Route | Role |
|-------|------|
| `/my-instruments` | Return access library. Shows purchased instruments. |
| `/decision-paths` | Bundle progression paths (SEO/direct). |

---

## Progression Flow (Canonical)

```
Evidence → confirms system works under real conditions
    ↓
Decision Instruments → quantify, clarify, select
    ↓
Diagnostics → accumulate structural evidence
    ↓
Executive Reporting (£95) → price consequence, formalise position
    ↓
Strategy Room (£395) → execute intervention under governed conditions
```

---

## Pricing

| Product | Price | Category |
|---------|-------|----------|
| Decision Exposure Instrument | £29 | worksheet |
| Mandate Clarity Framework | £49 | framework |
| Intervention Path Selector | £79 | toolkit |
| Operator Decision Pack | £129 | bundle |
| Executive Reporting | £95 | flagship |
| Strategy Room | £395 | execution |
| Global Market Intelligence Q1 2026 | £59 | report |

---

## Visible Assets (Production)

### Decision Instruments (3)
- decision-exposure-instrument.pdf (private/assets/paid-instruments/)
- mandate-clarity-framework.pdf (private/assets/paid-instruments/)
- intervention-path-selector.pdf (private/assets/paid-instruments/)

### Case Dossiers (3)
- case-dossier-tariff-shock.pdf (private_storage/premium-content/case-dossiers/)
- case-dossier-team-alignment-illusion.pdf (private_storage/premium-content/case-dossiers/)
- case-dossier-escalation-denied.pdf (private_storage/premium-content/case-dossiers/)

### Market Intelligence (1)
- global-market-intelligence-report-q1-2026 (paid, gated)

### Hidden (not shipped — do NOT surface)
- structural-failure-diagnostic-canvas
- team-alignment-gap-map
- escalation-readiness-scorecard
- governance-drift-detector
- strategic-priority-stack-builder
- execution-risk-index
- board-brief-template-structured

---

## Core Vocabulary (Enforced)

| Use | Do NOT use |
|-----|-----------|
| Execute | Explore |
| Intervene | Advise |
| Condition | Situation |
| Consequence | Impact |
| Governed | Guided |
| Classify | Assess |
| Determine | Suggest |
| Instrument | Template |
| Dossier | Case study |
| Execution environment | Strategy room product |
| Price consequence | Understand risk |
| Enter | Buy / Purchase / Checkout |

---

## Transition Language (Standardised)

| From | To | CTA Pattern |
|------|-----|------------|
| Instrument → ER | "Price consequence in Executive Reporting" |
| Instrument → SR | "Enter execution environment" |
| ER → SR | "Execution required. Enter Strategy Room." |
| Diagnostic → ER | "View Executive Reporting" |
| Evidence → system | Per-dossier system link |

---

## Access Model

| State | Behaviour |
|-------|-----------|
| NO_ACCESS | Show purchase surface |
| HAS_ACCESS | Show instrument environment / content |
| JUST_PURCHASED | Show access confirmation + auto-scroll to environment |

All access resolves through `resolveCanonicalEntitlement()`. Email-based. Survives logout + device switch.

---

## Navigation

### Header (primary nav)
- Diagnostics
- Decision Paths
- Executive Report (£95)
- Strategy Room (£395)

### Header (secondary nav)
- Intelligence
- Playbooks
- Canon

### NOT in navigation
- Decision Instruments (accessed via homepage + direct links)
- Evidence (accessed via homepage)
- My Instruments (accessed via user menu)
