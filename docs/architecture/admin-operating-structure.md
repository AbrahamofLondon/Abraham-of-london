# Admin Operating Structure

## Principle

The admin area is an Operator Console with clear domains — not a list of admin pages.

## Domains

### 1. Command Centre

Global system control surface.

| Route | Role | Risk | Audit |
|---|---|---|---|
| `/admin` | ADMIN | MEDIUM | No |
| `/admin/operator` | ADMIN | HIGH | Yes |
| `/admin/command-wall` | ADMIN | CRITICAL | Yes |
| `/admin/command` | ADMIN | CRITICAL | Yes |
| `/admin/authority-center` | ADMIN | HIGH | Yes |
| `/admin/product-surfaces` | ADMIN | LOW | No |

### 2. Product Operations

Diagnostics, reports, rooms, boardroom, enterprise.

| Route | Role | Risk | Audit |
|---|---|---|---|
| `/admin/reporting/executive` | ADMIN | HIGH | Yes |
| `/admin/reports` | ADMIN | MEDIUM | No |
| `/admin/reporting/lineage` | ADMIN | MEDIUM | No |
| `/admin/strategy-room` | ADMIN | HIGH | Yes |
| `/admin/enterprise` | OWNER | CRITICAL | Yes |
| `/admin/campaign` | ADMIN | HIGH | Yes |
| `/admin/calibration` | ADMIN | MEDIUM | No |
| `/admin/institutional-analytics` | ADMIN | LOW | No |
| `/admin/retained-cadence` | ADMIN | MEDIUM | Yes |
| `/admin/retainer-readiness` | ADMIN | MEDIUM | No |
| `/admin/oversight-review` | ADMIN | HIGH | Yes |
| `/admin/outcome-ledger` | ADMIN | MEDIUM | No |
| `/admin/suppression-ledger` | OWNER | CRITICAL | Yes |

### 3. Intelligence Foundry

Research runs, simulations, red-team, adapter health.

| Route | Role | Risk | Audit |
|---|---|---|---|
| `/admin/intelligence-foundry` | ADMIN | MEDIUM | No |
| `/admin/intelligence-foundry/runs` | ADMIN | MEDIUM | Yes |
| `/admin/intelligence-foundry/scenario` | ADMIN | LOW | No |
| `/admin/intelligence-foundry/simulation/*` | ADMIN | LOW | No |
| `/admin/intelligence-foundry/engines` | ADMIN | MEDIUM | No |
| `/admin/intelligence-foundry/performance` | ADMIN | LOW | No |
| `/admin/intelligence-foundry/chaos` | OWNER | CRITICAL | Yes |
| `/admin/intelligence-foundry/data-poisoning` | OWNER | HIGH | Yes |
| `/admin/intelligence-foundry/health` | ADMIN | LOW | No |
| `/admin/intelligence-foundry/trash-day` | ADMIN | MEDIUM | Yes |
| `/admin/intelligence-foundry/red-team/content` | ADMIN | MEDIUM | No |
| `/admin/intelligence-foundry/red-team/security` | OWNER | CRITICAL | Yes |
| `/admin/intelligence-foundry/outbound` | ADMIN | MEDIUM | No |
| `/admin/intelligence-foundry/product-health` | ADMIN | LOW | No |

### 4. Content & Editorial

Editorials, essays, outbound drafts, style checks.

| Route | Role | Risk | Audit |
|---|---|---|---|
| `/admin/content` | ADMIN | MEDIUM | Yes |
| `/admin/content-vault` | ADMIN | MEDIUM | No |

### 5. Outbound Publishing

Facebook, X, LinkedIn, sync state, publish attempts.

| Route | Role | Risk | Audit |
|---|---|---|---|
| `/admin/outbound/linkedin` | ADMIN | HIGH | Yes |
| `/admin/outbound/facebook` | ADMIN | HIGH | Yes |
| `/admin/outbound/x` | ADMIN | HIGH | Yes |

### 6. Access & Entitlements

Users, access tiers, Inner Circle, product grants.

| Route | Role | Risk | Audit |
|---|---|---|---|
| `/admin/access` | OWNER | CRITICAL | Yes |
| `/admin/users` | OWNER | CRITICAL | Yes |

### 7. Audit & Lineage

System audit, report lineage, Foundry audit, security audit.

| Route | Role | Risk | Audit |
|---|---|---|---|
| `/admin/audit` | OWNER | HIGH | No |
| `/admin/reporting/lineage` | ADMIN | MEDIUM | No |

### 8. Intelligence

Decision intelligence, GMI, market intelligence.

| Route | Role | Risk | Audit |
|---|---|---|---|
| `/admin/decision-intelligence` | ADMIN | MEDIUM | No |
| `/admin/intelligence` | ADMIN | MEDIUM | No |
| `/admin/intelligence/gmi-release-console` | ADMIN | HIGH | Yes |
| `/admin/intelligence/gmi-signal-monitor` | ADMIN | MEDIUM | No |
| `/admin/intelligence/gmi-event-log` | ADMIN | LOW | No |
| `/admin/decision/efficacy` | ADMIN | MEDIUM | No |
| `/admin/decision/governance` | ADMIN | HIGH | Yes |
| `/admin/decision/performance` | ADMIN | LOW | No |
| `/admin/decision/metadata-audit` | ADMIN | LOW | No |

## Owner-Only Routes

These routes require OWNER role (not merely ADMIN):

| Route | Domain |
|---|---|
| `/admin/enterprise` | Product Operations |
| `/admin/intelligence-foundry/chaos` | Foundry |
| `/admin/intelligence-foundry/data-poisoning` | Foundry |
| `/admin/intelligence-foundry/red-team/security` | Foundry |
| `/admin/access` | Access |
| `/admin/users` | Access |
| `/admin/audit` | Audit |
| `/admin/suppression-ledger` | Product Operations |

## Risk Levels by Domain

| Domain | CRITICAL | HIGH | MEDIUM | LOW |
|---|---|---|---|---|
| Command Centre | 2 | 2 | 1 | 1 |
| Product Operations | 2 | 4 | 5 | 2 |
| Intelligence Foundry | 2 | 2 | 5 | 7 |
| Content & Editorial | 0 | 0 | 2 | 0 |
| Outbound Publishing | 0 | 3 | 0 | 0 |
| Access & Entitlements | 2 | 0 | 0 | 0 |
| Audit & Lineage | 0 | 1 | 1 | 0 |
| Intelligence | 0 | 2 | 4 | 3 |
