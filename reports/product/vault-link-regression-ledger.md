# Vault Link Regression Ledger

Generated: 2026-07-18
Source audit log: `reports/product/phase-1-5-pnpm-vault-audit.log`

Findings: 56
UNKNOWN: 0

Classification rule used for this ledger:

- `MISSING_ALLOWLIST_ENTRY`: the referenced route is implemented by a static or dynamic route/content surface, but the audit governance does not yet authorise the path family.
- `BROKEN_PUBLIC_LINK`: no matching static, dynamic or content route was found; the content link must be repaired or removed rather than allowlisted.

| ID | Source | Target | Target Exists | Classification | Status |
|---|---|---|---:|---|---|
| VAULT-LINK-001 | content/intelligence/decision-delay-governance-cost.mdx:158 | `/tools/decision-delay-exposure` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-002 | content/intelligence/decision-delay-governance-cost.mdx:159 | `/diagnostics/fast` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-003 | content/intelligence/index.mdx:110 | `/tools/decision-delay-exposure` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-004 | content/intelligence/index.mdx:112 | `/diagnostics/fast` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-005 | content/intelligence/index.mdx:110 | `/tools/decision-delay-exposure` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-006 | content/intelligence/index.mdx:112 | `/diagnostics/fast` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-007 | content/intelligence/index.mdx:183 | `/provenance/demo` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-008 | content/intelligence/index.mdx:184 | `/trust` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-009 | content/intelligence/index.mdx:185 | `/library` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-010 | content/intelligence/strategic-autonomy-001.mdx:151 | `/intelligence/strategic-autonomy-002` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-011 | content/intelligence/strategic-autonomy-002.mdx:286 | `/intelligence` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-012 | content/intelligence/strategic-autonomy-003.mdx:233 | `/intelligence/strategic-autonomy-002` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-013 | content/intelligence/strategic-autonomy-003.mdx:233 | `/intelligence/strategic-autonomy-004` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-014 | content/intelligence/strategic-autonomy-003.mdx:233 | `/intelligence/strategic-autonomy-002` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-015 | content/intelligence/strategic-autonomy-004.mdx:251 | `/intelligence/strategic-autonomy-003` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-016 | content/intelligence/strategic-autonomy-004.mdx:251 | `/intelligence/strategic-autonomy-005` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-017 | content/intelligence/strategic-autonomy-004.mdx:255 | `/intelligence/strategic-autonomy-002` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-018 | content/intelligence/strategic-autonomy-004.mdx:251 | `/intelligence/strategic-autonomy-003` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-019 | content/intelligence/strategic-autonomy-005.mdx:289 | `/intelligence/strategic-autonomy-004` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-020 | content/intelligence/strategic-autonomy-005.mdx:289 | `/intelligence/strategic-autonomy-006` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-021 | content/intelligence/strategic-autonomy-006.mdx:261 | `/intelligence/strategic-autonomy-005` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-022 | content/intelligence/strategic-autonomy-006.mdx:261 | `/intelligence/strategic-autonomy-007` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-023 | content/intelligence/strategic-autonomy-007.mdx:228 | `/intelligence/strategic-autonomy-001` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-024 | content/intelligence/strategic-autonomy-007.mdx:229 | `/intelligence/strategic-autonomy-002` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-025 | content/intelligence/strategic-autonomy-007.mdx:230 | `/intelligence/strategic-autonomy-003` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-026 | content/intelligence/strategic-autonomy-007.mdx:231 | `/intelligence/strategic-autonomy-004` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-027 | content/intelligence/strategic-autonomy-007.mdx:232 | `/intelligence/strategic-autonomy-005` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-028 | content/intelligence/strategic-autonomy-007.mdx:233 | `/intelligence/strategic-autonomy-006` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-029 | content/intelligence/strategic-autonomy-007.mdx:233 | `/intelligence/strategic-autonomy-006` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-030 | content/intelligence/strategic-autonomy-007.mdx:228 | `/intelligence` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-031 | content/intelligence/strategic-autonomy-007.mdx:233 | `/intelligence/strategic-autonomy-006` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-032 | content/intelligence/strategic-autonomy-008.mdx:251 | `/intelligence/strategic-autonomy-007` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-033 | content/intelligence/strategic-autonomy-008.mdx:251 | `/intelligence/strategic-autonomy-009` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-034 | content/intelligence/strategic-autonomy-009.mdx:268 | `/intelligence/strategic-autonomy-008` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-035 | content/intelligence/strategic-autonomy-009.mdx:268 | `/intelligence/strategic-autonomy-010` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-036 | content/intelligence/strategic-autonomy-010.mdx:271 | `/intelligence/strategic-autonomy-009` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-037 | content/intelligence/strategic-autonomy-010.mdx:271 | `/intelligence/strategic-autonomy-011` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-038 | content/intelligence/strategic-autonomy-011.mdx:269 | `/intelligence/strategic-autonomy-010` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-039 | content/intelligence/strategic-autonomy-011.mdx:269 | `/intelligence/strategic-autonomy-012` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-040 | content/playbooks/decision-exposure-public.mdx:152 | `/playbooks/execution-integrity-public` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-041 | content/playbooks/decision-exposure-public.mdx:153 | `/playbooks/mandate-clarity-public` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-042 | content/playbooks/execution-integrity-public.mdx:158 | `/playbooks/decision-exposure-public` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-043 | content/playbooks/execution-integrity-public.mdx:159 | `/playbooks/mandate-clarity-public` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-044 | content/playbooks/intervention-path-public.mdx:32 | `/decision-instruments/intervention-path-selector` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-045 | content/playbooks/intervention-path-public.mdx:133 | `/decision-instruments/decision-exposure-instrument` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-046 | content/playbooks/mandate-clarity-public.mdx:153 | `/playbooks/execution-integrity-public` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-047 | content/playbooks/mandate-clarity-public.mdx:154 | `/playbooks/decision-exposure-public` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-048 | content/resources/canon-household-charter.mdx:111 | `/toolkits/succession-engineering` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-049 | content/resources/canon-household-charter.mdx:112 | `/toolkits/leadership-formation` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-050 | content/resources/getting-started.mdx:71 | `/diagnostics/fast` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-051 | content/resources/getting-started.mdx:81 | `/toolkits/institutional-diagnostics` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-052 | content/resources/getting-started.mdx:82 | `/decision-instruments/decision-exposure-instrument` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-053 | content/resources/getting-started.mdx:71 | `/diagnostics/fast` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-054 | content/resources/purpose-alignment-checklist.mdx:115 | `/toolkits/culture-shaping` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-055 | content/resources/purpose-alignment-checklist.mdx:116 | `/toolkits/leadership-formation` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |
| VAULT-LINK-056 | content/resources/purpose-alignment-checklist.mdx:126 | `/diagnostics/purpose-alignment` | True | MISSING_ALLOWLIST_ENTRY | CONFIRMED |