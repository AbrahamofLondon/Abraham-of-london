# Product Architecture v2

Generated: 2026-06-01

## Three-Layer Architecture

### A. Market Activation Layer

**Role:** Create fast first-session proof of value. Show what the system can do before requiring the user to climb the full corridor.

**These are NOT corridor stages.** They are front-door routes into the corridor.

| Surface | Input Required | Value Delivered | Corridor Entry Point |
|---------|---------------|-----------------|---------------------|
| Boardroom-first Brief | decision, owner, blocker, consequence, deadline, evidence, authority uncertainty | Boardroom readiness, objections, evidence weaknesses, trade-offs, decision paths | Executive Reporting or Boardroom Mode |
| Scenario Stress Test Hook | 3 scenario choices + optional explanation | Scenario insight, consistency check, board challenge implication | Enterprise Assessment |
| Quick Decision Health Check | decision, owner, blocker, consequence, deadline | Decision class, authority/evidence/consequence state, recommended corridor path | Team Assessment or Enterprise Assessment |
| Sample Boardroom Dossier | Canned sample spine | Downloadable/viewable sample dossier | Boardroom Mode |

**Planned status:** All four surfaces are PLANNED. No runtime implementation in this pass.

### B. Operational Decision Intelligence Corridor

**Role:** Corporate decision enforcement and governance. The paid corridor.

**Stages (in order):**
1. **Team Assessment** — Multi-respondent perception divergence detection
2. **Enterprise Assessment** — Organisational dependency, scenario, and exposure analysis
3. **Executive Reporting** — Board-grade intelligence synthesis with constitutional guidance
4. **Boardroom Mode** — Adversarial scrutiny of decision quality
5. **Strategy Room** — Governed decision execution with checkpoints
6. **Retainer Review Queue** — ACTIVE transition stage; operator-reviewed readiness gate
7. **Retainer Oversight** — GATED; institutional intelligence, drift monitoring, outcome learning

**Retainer Review Queue** is the bridge between Strategy Room and Retainer Oversight. It is ACTIVE with Prisma persistence and auth-guarded API routes. It does not activate Retainer Oversight.

### C. Purpose Alignment Product Line

**Role:** Personal mandate clarity and behavioural enforcement.

**Boundary:** Purpose Alignment is a separate product line. It may contribute behavioural evidence to the Decision Centre, but it is NOT a prerequisite or stage of the ODI corridor.

**Surfaces:** Free Signal, Fast Diagnostic, Purpose Alignment (free + paid).

---

## Commercial Progression

| Tier | Surfaces | Access |
|------|----------|--------|
| **Free / Lead Magnet** | Scenario Stress Test Hook, Sample Boardroom Dossier, Quick Decision Health Check (limited) | No login required |
| **Entry Paid** | Boardroom-first Brief, Executive Reporting lite | Single purchase |
| **Core Paid** | Enterprise Assessment, Executive Reporting, Boardroom Mode | Per-engagement |
| **High Paid** | Strategy Room, Retainer Review Queue | Per-engagement + operator review |
| **Retainer** | Retainer Oversight | Monthly; requires readiness threshold + durable memory |

---

## Architecture Rules

1. The corridor is the moat — each stage must prove value that the previous stage cannot.
2. The first encounter is the sale — Market Activation surfaces must demonstrate capability immediately.
3. Purpose Alignment is independent — it feeds evidence to Decision Centre but does not gate ODI.
4. No surface may claim output unsupported by current capability status.
5. Retainer Oversight requires durable recommendation/outcome memory. It is not activated by payment alone.
6. Boardroom value must not be buried behind the full diagnostic ladder.
