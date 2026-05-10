# Operator / Sponsor Surface Exposure Register

Classification: `ADMIN_COMMAND_SURFACE_FOUNDATION_READY`

## Purpose

This register classifies admin surfaces by their exposure safety for operator and sponsor roles. A high-ticket buyer will not care that admin pages exist. They care that the right people see the right things safely.

---

## Classification Key

| Classification | Meaning |
|---|---|
| `ADMIN_ONLY` | Only system administrators. Contains internal metrics, raw data, or system controls. |
| `OPERATOR_SAFE` | Can be shown to a retained engagement operator. No raw respondent text, no internal pricing. |
| `SPONSOR_SAFE_AFTER_SUPPRESSION` | Can be shown to sponsor/owner after suppression ledger filters respondent text and small-sample aggregates. |
| `NEVER_CLIENT_VISIBLE` | Contains security keys, system diagnostics, or pipeline data. Never expose. |
| `FUTURE_CONTROL_ROOM_CANDIDATE` | Could become part of a client-facing "Control Room" surface in future. Requires suppression, role gating, and design review. |

---

## Surface Classifications

### Command Centre

| Surface | Classification | Notes |
|---|---|---|
| `/admin` (Dashboard) | ADMIN_ONLY | Deal flow stats, conversion metrics |
| `/admin/command-wall` | ADMIN_ONLY | System controls, context registry |
| `/admin/authority-center` | ADMIN_ONLY | Internal decision authority audit |

### Decision Intelligence

| Surface | Classification | Notes |
|---|---|---|
| `/admin/decision-intelligence` | ADMIN_ONLY | Conversion funnels, revenue attribution |
| `/admin/intelligence` | ADMIN_ONLY | Deal flow audit stream |
| `/admin/decision/*` (all) | ADMIN_ONLY | Decision efficacy, governance, performance |

### Retained Oversight (Highest exposure potential)

| Surface | Classification | Notes |
|---|---|---|
| `/admin/retained-cadence` | OPERATOR_SAFE | Cadence cycle management. No raw text. |
| `/admin/retainer-readiness` | OPERATOR_SAFE | Contract readiness scorecard. |
| `/admin/oversight-review` | OPERATOR_SAFE | Governed review bench. Suppression controls visible. |
| `/admin/outcome-ledger` | OPERATOR_SAFE | Decision-to-outcome tracking. |
| `/admin/suppression-ledger` | OPERATOR_SAFE | Suppression audit trail. Shows what was withheld, not the content. |

### Boardroom & Counsel

| Surface | Classification | Notes |
|---|---|---|
| `/admin/boardroom-archive` | FUTURE_CONTROL_ROOM_CANDIDATE | Could show to sponsor after suppression review. |
| `/admin/counsel-review` | ADMIN_ONLY | Contains internal reviewer notes. |

### Delivery & Proof

| Surface | Classification | Notes |
|---|---|---|
| `/admin/delivery-queue` | OPERATOR_SAFE | Delivery approve/fail queue. |
| `/admin/proof` | ADMIN_ONLY | Evidence review with anonymisation controls. |
| `/admin/pdf-dashboard` | ADMIN_ONLY | Document analytics. |
| `/admin/pdf-status` | ADMIN_ONLY | Filesystem PDF status. |

### Campaigns & Organisations

| Surface | Classification | Notes |
|---|---|---|
| `/admin/campaigns` | ADMIN_ONLY | Campaign management. |
| `/admin/organisations` | ADMIN_ONLY | Organisation management. |
| `/admin/enterprise-pipeline` | NEVER_CLIENT_VISIBLE | Sales pipeline with win probability. |
| `/admin/enterprise-foundation` | ADMIN_ONLY | Foundation program listing. |

### Diagnostics & Analytics

| Surface | Classification | Notes |
|---|---|---|
| `/admin/institutional-analytics` | FUTURE_CONTROL_ROOM_CANDIDATE | Could show aggregated analytics to sponsors. Requires suppression layer. |
| `/admin/calibration` | ADMIN_ONLY | Decision calibration. |
| `/admin/launch-dashboard` | ADMIN_ONLY | Launch readiness metrics. |

### Commercial & System

| Surface | Classification | Notes |
|---|---|---|
| `/admin/commercial` | ADMIN_ONLY | Commercial infrastructure. |
| `/admin/validation` | ADMIN_ONLY | Product readiness checks. |
| `/admin/conversion-dashboard` | NEVER_CLIENT_VISIBLE | Conversion funnel data. |
| `/admin/redis` | NEVER_CLIENT_VISIBLE | System diagnostics. |
| `/admin/access-keys` | NEVER_CLIENT_VISIBLE | Key management. |

---

## Summary

| Classification | Count |
|---|---|
| ADMIN_ONLY | 22 |
| OPERATOR_SAFE | 5 |
| FUTURE_CONTROL_ROOM_CANDIDATE | 2 |
| NEVER_CLIENT_VISIBLE | 5 |
| **Total** | **34** |

## Next Steps for £50k Posture

The 5 OPERATOR_SAFE surfaces form the core operator command experience:
1. **Retained Cadence** — cycle management
2. **Retainer Readiness** — contract scorecard
3. **Oversight Review** — governed review bench
4. **Outcome Ledger** — decision-to-outcome tracking
5. **Delivery Queue** — delivery approve/fail

These should be the first surfaces exposed to a qualified operator role beyond admin-only access when the role-gating infrastructure supports it.
