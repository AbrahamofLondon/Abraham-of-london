# Authority Restoration Baseline Worktree Inventory

Generated: 2026-06-14

Authority restoration performed: no

Positive authority allowed: 0

## Inclusion Rule

Included files are limited to authority-gate infrastructure, current authority reports, board/surface authority-boundary language needed for current gate results, and the `team_assessment` rendered artifact required by verifier-derived evidence state.

Excluded files are generated PDF registry/download metadata and temporary surface listings that are not required for authority review.

## Must Commit Before Review

| File / Group | Classification | Reason |
| --- | --- | --- |
| `app/api/admin/boardroom-delivery/generate/route.ts` | authority_required | Board-facing runtime route scanned by authority language guard. |
| `components/instruments/BoardBriefBuilderRunner.tsx` | authority_required | Board brief builder customer surface. |
| `lib/admin/product-surface-registry.ts` | authority_required | Admin/report surface authority registry. |
| `lib/admin/reporting/report-pdf.tsx` | authority_required | Report delivery surface. |
| `lib/commercial/catalog.ts` | authority_required | Public product catalogue language. |
| `lib/commercial/premium-decision-assets.ts` | authority_required | Commercial decision asset language scanned by board guard. |
| `lib/constitution/boardroom-mode.ts` | authority_required | Boardroom mode authority boundary. |
| `lib/instruments/board-brief-template/engine.ts` | authority_required | Board brief runtime engine. |
| `lib/instruments/governed-instrument-contract.ts` | authority_required | Instrument registry language bounded from board-ready to user-supplied draft. |
| `lib/intelligence/gmi-instrument.ts` | authority_required | Market intelligence instrument authority boundary. |
| `lib/pdf/oversight-brief-pdf.tsx` | authority_required | PDF report authority language. |
| `lib/product/instrument-signal-authority.ts` | authority_required | Instrument signal authority wording. |
| `pages/decision-instruments/board-brief-builder/run.tsx` | authority_required | Customer route authority boundary. |
| `lib/board/evidence-governance.ts` | authority_required | Board evidence-governance primitive scanned by guard. |
| `lib/product/authority-critical-paths.ts` | authority_required | Authority-critical path definitions. |
| `lib/product/authority-evidence-source-policy.ts` | authority_required | Report-as-descriptive-only evidence policy. |
| `lib/product/authority-gate-hierarchy.ts` | authority_required | Blocking/informational gate hierarchy. |
| `lib/product/rendered-output-substance-policy.ts` | authority_required | Rendered output substance policy. |
| `scripts/check-no-mock-authority.mjs` | authority_required | No-mock authority gate. |
| `scripts/check-report-as-evidence-violations.mjs` | authority_required | Report-as-evidence gate. |
| `scripts/generate-v2-evidence-ledger.mjs` | authority_required | Evidence ledger generation path. |
| `scripts/verify-evidence-ledger-artifacts.mjs` | authority_required | Evidence artifact verifier. |
| `scripts/capture-team-assessment-output.mjs` | authority_required | Team assessment artifact capture. |
| `scripts/check-authority-safe-language.mjs` | authority_required | Authority-safe language gate, currently failing. |
| `scripts/check-board-facing-authority-language.mjs` | authority_required | Board-facing authority language guard. |
| `scripts/check-effective-authority-surfaces.mjs` | authority_required | Effective authority surface scan. |
| `scripts/validate-team-assessment-v2.mjs` | authority_required | Team assessment validation artifact producer. |
| `artifacts/validation/team_assessment/rendered-output.json` | generated_artifact | Required rendered output artifact for verifier-derived `team_assessment` state. |
| Current authority reports in `reports/` | prior_pass_report | Current gate outputs and truth records needed to review the baseline. |

## Excluded From Authority Baseline

| File | Classification | Reason |
| --- | --- | --- |
| `lib/pdf/pdf-registry.generated.ts` | generated_artifact | Generated PDF registry outside authority eligibility review scope. |
| `public/assets/downloads/pdf-duplicates.json` | generated_artifact / safe_to_regenerate | Generated PDF metadata outside authority review scope. |
| `public/assets/downloads/pdf-manifest.json` | generated_artifact / safe_to_regenerate | Generated PDF metadata outside authority review scope. |
| `public/assets/downloads/pdf-stubs.json` | generated_artifact / safe_to_regenerate | Generated PDF metadata outside authority review scope. |
| `_ta_surfaces.txt` | generated_artifact / must_exclude_from_review | Temporary surface listing; not required to reproduce gates. |

## Owner Decision

No file is blocked on owner decision in this baseline. Excluded generated files remain dirty and disclosed.
