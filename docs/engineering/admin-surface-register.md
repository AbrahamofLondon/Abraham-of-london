# Admin Surface Register

Generated: 2026-05-10

## Pages Router (`pages/admin/`)

| Route | Layout | Target Layout | Role | Quality | Security | Operator-Safe? |
|---|---|---|---|---|---|---|
| `/admin` | admin/AdminLayout | Canonical | admin | POLISHED | guarded | No — internal metrics |
| `/admin/access-keys` | admin/AdminLayout | Canonical | admin | POLISHED | guarded | No — key management |
| `/admin/access-revoke` | redirect | N/A | admin | FUNCTIONAL | redirect | N/A |
| `/admin/assets` | admin/AdminLayout | Canonical | admin | ROUGH | guarded | No |
| `/admin/authority-center` | admin/AdminLayout | Canonical | admin | POLISHED | guarded | No — internal decision audit |
| `/admin/boardroom-archive` | admin/AdminLayout | Canonical | admin | FUNCTIONAL | guarded | Future: OPERATOR_SAFE |
| `/admin/calibration` | admin/AdminLayout | Canonical | admin | ROUGH | guarded | No |
| `/admin/command-wall` | admin/AdminLayout | Canonical | admin | POLISHED | guarded | No |
| `/admin/conversion-dashboard` | admin/AdminLayout | Canonical | admin | FUNCTIONAL | guarded | No — conversion metrics |
| `/admin/counsel-review` | admin/AdminLayout | Canonical | admin | FUNCTIONAL | guarded | Future: OPERATOR_SAFE |
| `/admin/delivery-queue` | admin/AdminLayout | Canonical | operator | FUNCTIONAL | guarded | Yes — OPERATOR_SAFE |
| `/admin/enterprise-foundation` | admin/AdminLayout | Canonical | admin | FUNCTIONAL | guarded | No |
| `/admin/enterprise-pipeline` | admin/AdminLayout | Canonical | admin | POLISHED | guarded | No — sales pipeline |
| `/admin/inner-circle` | admin/AdminLayout | Canonical | admin | FUNCTIONAL | guarded | No |
| `/admin/institutional-analytics` | standalone | Canonical | admin | STUB | guarded | Future: OPERATOR_SAFE |
| `/admin/intelligence` | admin/AdminLayout | Canonical | admin | POLISHED | guarded | No — deal flow audit |
| `/admin/launch-dashboard` | admin/AdminLayout | Canonical | admin | FUNCTIONAL | guarded | No |
| `/admin/login` | standalone | standalone | public | POLISHED | public | N/A |
| `/admin/outcome-ledger` | admin/AdminLayout | Canonical | operator | POLISHED | guarded | Yes — OPERATOR_SAFE |
| `/admin/oversight-review` | admin/AdminLayout | Canonical | operator | POLISHED | guarded | Yes — OPERATOR_SAFE |
| `/admin/pdf-dashboard` | admin/AdminLayout | Canonical | admin | FUNCTIONAL | guarded | No |
| `/admin/pdf-status` | admin/AdminLayout | Canonical | admin | FUNCTIONAL | guarded | No |
| `/admin/proof` | admin/AdminLayout | Canonical | admin | POLISHED | guarded | No — evidence review |
| `/admin/redis` | admin/AdminLayout | Canonical | admin | FUNCTIONAL | guarded | No — system diagnostics |
| `/admin/retained-cadence` | admin/AdminLayout | Canonical | operator | FUNCTIONAL | guarded | Yes — OPERATOR_SAFE |
| `/admin/retainer-readiness` | admin/AdminLayout | Canonical | operator | FUNCTIONAL | guarded | Yes — OPERATOR_SAFE |
| `/admin/suppression-ledger` | admin/AdminLayout | Canonical | operator | FUNCTIONAL | guarded | Yes — OPERATOR_SAFE |
| `/admin/validation` | admin/AdminLayout | Canonical | admin | FUNCTIONAL | guarded | No |

## App Router (`app/admin/`)

| Route | Layout | Target Layout | Role | Quality | Security | Operator-Safe? |
|---|---|---|---|---|---|---|
| `/admin/audit` | app layout | Canonical | admin | FUNCTIONAL | layout-guarded | No |
| `/admin/campaigns` | app layout | Canonical | admin | POLISHED | layout-guarded | No |
| `/admin/campaigns/new` | app layout | Canonical | admin | POLISHED | layout-guarded | No |
| `/admin/campaigns/[id]` | app layout | Canonical | admin | POLISHED | layout-guarded | No |
| `/admin/campaigns/[id]/report` | app layout | Canonical | admin | POLISHED | layout-guarded | No |
| `/admin/command` | app layout | Canonical | admin | FUNCTIONAL | layout-guarded | No |
| `/admin/commercial` | app layout | Canonical | admin | FUNCTIONAL | layout-guarded | No |
| `/admin/decision-intelligence` | app layout | Canonical | admin | POLISHED | layout-guarded | No |
| `/admin/decision/efficacy` | app layout | Canonical | admin | POLISHED | layout-guarded | No |
| `/admin/decision/governance` | app layout | Canonical | admin | POLISHED | layout-guarded | No |
| `/admin/decision/performance` | app layout | Canonical | admin | POLISHED | layout-guarded | No |
| `/admin/decision/contextual-efficacy` | app layout | Canonical | admin | POLISHED | layout-guarded | No |
| `/admin/decision/contextual-ranking` | app layout | Canonical | admin | POLISHED | layout-guarded | No |
| `/admin/decision/metadata-audit` | app layout | Canonical | admin | POLISHED | layout-guarded | No |
| `/admin/organisations` | app layout | Canonical | admin | POLISHED | layout-guarded | No |
| `/admin/organisations/new` | app layout | Canonical | admin | POLISHED | layout-guarded | No |
| `/admin/organisations/[id]` | app layout | Canonical | admin | POLISHED | layout-guarded | No |
| `/admin/organisations/[id]/dashboard` | app layout | Canonical | admin | POLISHED | layout-guarded | No |
| `/admin/organisations/[id]/report` | app layout | Canonical | admin | POLISHED | layout-guarded | No |
| `/admin/reporting/executive/[...slug]` | app layout | Canonical | admin | POLISHED | layout-guarded | No |
| `/admin/reports` | app layout | Canonical | admin | FUNCTIONAL | layout-guarded | No |
| `/admin/snapshot` | app layout | Canonical | admin | FUNCTIONAL | layout-guarded | No |

## Summary

- **Total admin routes**: 52
- **Pages Router**: 28
- **App Router**: 24
- **All guarded**: Yes (100%)
- **POLISHED**: ~18
- **FUNCTIONAL**: ~25
- **ROUGH/STUB**: ~9
- **Operator-safe candidates**: 7 (delivery-queue, outcome-ledger, oversight-review, retained-cadence, retainer-readiness, suppression-ledger, boardroom-archive after suppression)
