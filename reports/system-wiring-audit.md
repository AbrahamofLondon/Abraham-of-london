# System Wiring Audit

## Gate Result

PASSED_WITH_FINDINGS

## Wiring State

fragmented

## Journey Trace

| Journey | Route | Route Exists | Renders | Real Logic | ProductAuthorityContract | Evidence Linkage | Useful Output | Next Action | Dashboard / Report / Fulfilment | Flags | Recommended Action |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
| fast_diagnostic | /diagnostics/fast -> /foundry/decision-test | yes | no | yes | no | yes | yes | yes | yes | authority_bypass, surface_overclaim | Wire ProductAuthorityContract into fast_diagnostic surface before relying on authority language. |
| team_assessment | /diagnostics/team-assessment | yes | no | yes | no | yes | yes | yes | yes | authority_bypass, surface_overclaim | Wire ProductAuthorityContract into team_assessment surface before relying on authority language. |
| enterprise_assessment | /diagnostics/enterprise-assessment | yes | no | yes | no | yes | yes | yes | yes | authority_bypass, surface_overclaim | Wire ProductAuthorityContract into enterprise_assessment surface before relying on authority language. |
| personal_decision_audit | /test-your-decision and /checkout/personal-decision-audit | yes | yes | yes | no | yes | yes | yes | yes | authority_bypass, surface_overclaim | Wire ProductAuthorityContract into personal_decision_audit surface before relying on authority language. |
| decision_centre | /decision-centre | yes | no | yes | no | yes | yes | yes | yes | authority_bypass, surface_overclaim | Wire ProductAuthorityContract into decision_centre surface before relying on authority language. |
| boardroom_mode | /boardroom dossier routes | yes | no | yes | no | yes | yes | yes | yes | authority_bypass, surface_overclaim | Wire ProductAuthorityContract into boardroom_mode surface before relying on authority language. |
| global_market_reports | /intelligence/market and /artifacts/global-market-outlook-q1-2026-public | yes | no | yes | no | yes | yes | yes | yes | static_route_pretending_to_be_product, authority_bypass, surface_overclaim | Wire ProductAuthorityContract into global_market_reports surface before relying on authority language. |
| admin_authority_dashboard | /admin/authority-center | yes | yes | yes | yes | yes | yes | yes | yes | none | Keep route under observation; no immediate blocker detected by static audit. |
| checkout_fulfilment | /checkout/* -> fulfilment | yes | yes | yes | no | yes | yes | yes | yes | authority_bypass, surface_overclaim | Wire ProductAuthorityContract into checkout_fulfilment surface before relying on authority language. |
| public_product_pages | /products /pricing /diagnostics /decision-instruments | yes | yes | yes | no | yes | yes | yes | yes | authority_bypass, surface_overclaim | Wire ProductAuthorityContract into public_product_pages surface before relying on authority language. |

## Flag Counts

- authority_bypass: 9
- surface_overclaim: 9
- static_route_pretending_to_be_product: 1

## Recommendations

- Make ProductAuthorityContract visible in route output for every product with a commercial or diagnostic claim.
- Attach route-output capture to live journeys, not only benchmark scripts.
- Connect public product pages to evidence-supported status so buyers see what is proven, blocked, or pending.
- Ensure checkout success routes land in fulfilled artifacts or persisted case state with authority/evidence status.
