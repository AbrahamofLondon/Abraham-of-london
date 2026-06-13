# Report-As-Evidence Violations

Generated: 2026-06-13T19:59:44.414Z

Gate: FAILED_REPORT_AS_EVIDENCE_VIOLATIONS

Scripts scanned: 3837

Violations: 370

## Rule

Reports can describe evidence, but cannot themselves constitute evidence.

## Violations

| File | Line | Reason | Context |
| --- | ---: | --- | --- |
| scripts/audit-product-authority-coverage.mjs | 381 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/audit-product-authority-coverage.mjs | 382 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | function deriveCategoryReadiness(rows) { |
| scripts/audit-product-authority-coverage.mjs | 383 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | if (rows.length !== REQUIRED_PRODUCT_COUNT) return "not_category_ready"; |
| scripts/audit-product-authority-coverage.mjs | 384 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | if (rows.some((row) => ["authority_contract_missing", "checkout_or_fulfilment_risk", "report_surface_risk", "overclaimed", "not_market_ready"].includes(row.currentCoverageClassification))) { |
| scripts/audit-product-authority-coverage.mjs | 385 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | return "category_infrastructure_present_but_not_visible"; |
| scripts/audit-product-authority-coverage.mjs | 386 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | } |
| scripts/audit-product-authority-coverage.mjs | 387 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | if (rows.some((row) => row.currentCoverageClassification === "authority_visible_but_thin" \|\| row.currentCoverageClassification === "underwired")) { |
| scripts/audit-product-authority-coverage.mjs | 589 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | "", |
| scripts/audit-product-authority-coverage.mjs | 590 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | "\| Product \| Name \| Authority State \| Route \| Checkout \| Report \| Admin \| Contract \| Authority \| Evidence \| Limitation \| Next Evidence \| Blocking \| Risk \| Falsification \| Classification \| Required Next Action \|", |
| scripts/audit-product-authority-coverage.mjs | 591 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | "\| --- \| --- \| --- \| ---: \| ---: \| ---: \| ---: \| ---: \| ---: \| ---: \| ---: \| ---: \| ---: \| ---: \| ---: \| --- \| --- \|", |
| scripts/audit-product-authority-coverage.mjs | 592 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | ...report.products.map((row) => `\| ${row.productCode} \| ${escapeMd(row.productName)} \| ${row.currentAuthorityState} \| ${yes(row.routeExists)} \| ${yes(row.checkoutPathExists)} \| ${yes(row.reportSurfaceExists)} \| ${yes(row.adminSurfaceExists)} \| ${yes(row.productAuthorityContractExists)} \| ${yes(row.authorityVisiblyRendered)} \| ${yes(row.evidenceStateVisiblyRendered)} \| ${yes(row.limitationVisiblyRendered)} \| ${yes(row.nextEvidenceActionVisiblyRendered)} \| ${yes(row.unsupportedClaimBlockingVisible)} \| ${yes(row.decisionRiskVisible)} \| ${yes(row.falsificationTriggerVisible)} \| ${row.currentCoverageClassification} \| ${escapeMd(row.requiredNextAction)} \|`), |
| scripts/audit-product-authority-coverage.mjs | 593 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | "", |
| scripts/audit-product-authority-coverage.mjs | 594 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | "## Implementation Priorities", |
| scripts/audit-product-authority-coverage.mjs | 595 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | "", |
| scripts/audit-product-claim-recovery.ts | 45 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | intervention_path_selector: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" }, |
| scripts/audit-product-claim-recovery.ts | 46 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | escalation_readiness_scorecard: { target: "signal_product", evidence: "blocked_until_claim_evidenced" }, |
| scripts/audit-product-claim-recovery.ts | 47 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | boardroom_mode: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" }, |
| scripts/audit-product-claim-recovery.ts | 48 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | diagnostic_report_basic: { target: "signal_product", evidence: "blocked_until_claim_evidenced" }, |
| scripts/audit-product-claim-recovery.ts | 49 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/audit-product-claim-recovery.ts | 50 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | // Tier 2 (9 products) |
| scripts/audit-product-claim-recovery.ts | 51 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | structural_failure_diagnostic_canvas: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" }, |
| scripts/audit-product-claim-recovery.ts | 53 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | team_alignment_gap_map: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" }, |
| scripts/audit-product-claim-recovery.ts | 54 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | governance_drift_detector: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" }, |
| scripts/audit-product-claim-recovery.ts | 55 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | strategic_priority_stack_builder: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" }, |
| scripts/audit-product-claim-recovery.ts | 56 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | executive_reporting: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" }, |
| scripts/audit-product-claim-recovery.ts | 57 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | diagnostic_report_pro: { target: "signal_product", evidence: "blocked_until_claim_evidenced" }, |
| scripts/audit-product-claim-recovery.ts | 58 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | operator_decision_pack: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" }, |
| scripts/audit-product-claim-recovery.ts | 59 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | command_pack: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" }, |
| scripts/audit-product-claim-recovery.ts | 86 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/audit-product-claim-recovery.ts | 87 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | // Other products |
| scripts/audit-product-claim-recovery.ts | 88 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | board_brief_builder: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" }, |
| scripts/audit-product-claim-recovery.ts | 89 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | executive_reporting_priority: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" }, |
| scripts/audit-product-claim-recovery.ts | 90 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | governance_suite: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" }, |
| scripts/audit-product-claim-recovery.ts | 91 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | operator_essentials_pack: { target: "diagnostic_product", evidence: "blocked_until_claim_evidenced" }, |
| scripts/audit-product-claim-recovery.ts | 92 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | }; |
| scripts/audit-report-authority-coverage.mjs | 164 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/audit-report-authority-coverage.mjs | 165 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | \| Product \| Fulfilment Type \| Authority \| Evidence \| Limitation \| Next Evidence \| Matrix Exemption \| Product-Specific Label \| Claim Conflict \| Result \| Required Action \| |
| scripts/audit-report-authority-coverage.mjs | 166 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | \| --- \| --- \| ---: \| ---: \| ---: \| ---: \| ---: \| ---: \| ---: \| --- \| --- \| |
| scripts/audit-report-authority-coverage.mjs | 167 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | ${report.rows.map((row) => `\| ${row.productCode} \| ${row.fulfilmentType} \| ${yes(row.authorityStatusVisible)} \| ${yes(row.evidenceStateVisible)} \| ${yes(row.limitationVisible)} \| ${yes(row.nextEvidenceActionVisible)} \| ${yes(row.exemptionConfirmedByMatrix)} \| ${yes(row.staticLabelVisible)} \| ${yes(row.authorityClaimLanguagePresent)} \| ${row.result} \| ${row.requiredAction} \|`).join("\n")} |
| scripts/audit-report-authority-coverage.mjs | 168 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | `; |
| scripts/audit-report-authority-coverage.mjs | 169 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | } |
| scripts/audit-report-authority-coverage.mjs | 170 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/audit-system-truth-state.mjs | 22 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | "WAVE_2B-1_CONTEXT_BOUND_VALIDATION_PROTOCOL_REPORT.md", |
| scripts/audit-system-truth-state.mjs | 31 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const PRODUCTS = [ |
| scripts/audit-system-truth-state.mjs | 639 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const boardGuard = parts.gateMeaningfulness.rows.find((row) => row.script.includes("check-board-facing")); |
| scripts/audit-system-truth-state.mjs | 641 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | gatePassed: Boolean(ESTATE_REPORT.gatePassed), |
| scripts/audit-system-truth-state.mjs | 642 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | readinessScope: ESTATE_REPORT.readinessScope ?? "unknown", |
| scripts/audit-system-truth-state.mjs | 643 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | blockingReasons: ESTATE_REPORT.blockingReasons ?? [], |
| scripts/audit-system-truth-state.mjs | 856 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/audit-system-truth-state.mjs | 857 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | function inferGateClaim(script) { |
| scripts/audit-system-truth-state.mjs | 858 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | if (script.includes("product-authority-contract")) return "ProductAuthorityContract consistency and public/non-exempt coverage."; |
| scripts/audit-system-truth-state.mjs | 859 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | if (script.includes("estate-authority-integrity")) return "Estate-level authority readiness from generated coverage reports."; |
| scripts/audit-system-truth-state.mjs | 860 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | if (script.includes("no-mock-authority")) return "No mock/fixture/placeholder authority grants."; |
| scripts/audit-system-truth-state.mjs | 861 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | if (script.includes("surface-claim-authority")) return "Public claim language does not exceed authority."; |
| scripts/audit-system-truth-state.mjs | 862 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | if (script.includes("market-adoption")) return "Market adoption posture and pain clarity."; |
| scripts/audit-universal-claim-authority.ts | 197 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | mkdirSync(REPORTS_DIR, { recursive: true }); |
| scripts/audit-universal-claim-authority.ts | 198 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/audit-universal-claim-authority.ts | 199 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | writeFileSync( |
| scripts/audit-universal-claim-authority.ts | 200 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | join(REPORTS_DIR, "universal-claim-authority.json"), |
| scripts/audit-universal-claim-authority.ts | 201 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | JSON.stringify( |
| scripts/audit-universal-claim-authority.ts | 202 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | { |
| scripts/audit-universal-claim-authority.ts | 203 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | generatedAt: new Date().toISOString(), |
| scripts/audit-universal-claim-authority.ts | 209 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | ) + "\n" |
| scripts/audit-universal-claim-authority.ts | 210 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | ); |
| scripts/audit-universal-claim-authority.ts | 211 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/audit-universal-claim-authority.ts | 212 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | console.log(`\nReport written: ${join(REPORTS_DIR, "universal-claim-authority.json")}`); |
| scripts/audit-universal-claim-authority.ts | 213 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/capture-category-route-proof.mjs | 416 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/capture-category-route-proof.mjs | 417 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | This route proof cannot imply estate readiness. Estate readiness requires the product authority coverage matrix, checkout coverage, report coverage, admin coverage, and public claim coverage to pass without findings. |
| scripts/capture-category-route-proof.mjs | 418 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/capture-category-route-proof.mjs | 419 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | --- |
| scripts/capture-category-route-proof.mjs | 420 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/capture-live-route-product-output.mjs | 42 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | generatedAt, |
| scripts/capture-live-route-product-output.mjs | 43 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | gate: capturesWithRenderedOutput.length > 0 && capturesWithRequiredFields.length > 0 ? "PASSED" : "FAILED", |
| scripts/capture-live-route-product-output.mjs | 44 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | doctrine: "Live route output must be captured before any product can be externally proven gold.", |
| scripts/capture-live-route-product-output.mjs | 45 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | routesDiscovered: WAVE_ONE_ROUTE_DISCOVERY, |
| scripts/capture-live-route-product-output.mjs | 46 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | captures, |
| scripts/capture-live-route-product-output.mjs | 47 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | counts: { |
| scripts/capture-live-route-product-output.mjs | 56 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | .map((route) => `${route.productCode}: route not found for ${route.requiredRoute}`), |
| scripts/capture-live-route-product-output.mjs | 57 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | }; |
| scripts/check-authority-grant-firewall.mjs | 28 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const ledgerReport = readJson("reports/evidence-ledger-artifact-verification.json", { rows: [] }); |
| scripts/check-authority-grant-firewall.mjs | 29 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const routeProof = readJson("reports/category-route-proof.json", { routes: [] }); |
| scripts/check-authority-grant-firewall.mjs | 30 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const matrix = readJson("reports/product-authority-coverage-matrix.json", { products: [] }); |
| scripts/check-authority-grant-firewall.mjs | 31 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const surfaceClaim = readJson("reports/surface-claim-authority-gate.json", readJson("reports/surface-claim-authority.json", {})); |
| scripts/check-authority-grant-firewall.mjs | 32 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const noMock = readJson("reports/no-mock-authority.json", {}); |
| scripts/check-authority-grant-firewall.mjs | 33 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/check-authority-grant-firewall.mjs | 34 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const ledgerByProduct = new Map((ledgerReport.rows ?? []).map((row) => [row.productCode, row])); |
| scripts/check-estate-authority-integrity.mjs | 172 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const serialized = { |
| scripts/check-estate-authority-integrity.mjs | 173 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | "category-route-proof": JSON.stringify(reports.routeProof), |
| scripts/check-estate-authority-integrity.mjs | 174 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | "category-demonstration-readiness": JSON.stringify(reports.categoryReadiness), |
| scripts/check-estate-authority-integrity.mjs | 175 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | "product-authority-contract": JSON.stringify(reports.contract), |
| scripts/check-estate-authority-integrity.mjs | 176 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | }; |
| scripts/check-estate-authority-integrity.mjs | 177 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | for (const [name, text] of Object.entries(serialized)) { |
| scripts/check-external-product-value-benchmark.mjs | 143 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | if (result.usefulnessProofs.length === 0) failures.push(`${result.productCode}: gold without customer usefulness proof.`); |
| scripts/check-external-product-value-benchmark.mjs | 144 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | } |
| scripts/check-external-product-value-benchmark.mjs | 145 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/check-external-product-value-benchmark.mjs | 146 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | // The internal 9.8 report may not claim gold beyond external proof once regenerated. |
| scripts/check-external-product-value-benchmark.mjs | 147 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const provenSet = new Set(confirmedGold.map((result) => result.productCode)); |
| scripts/check-external-product-value-benchmark.mjs | 148 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const evidenceCounts = { |
| scripts/check-external-product-value-benchmark.mjs | 149 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | antiToyFailures: results.filter((result) => result.failsAntiToy === true && (result.antiToyScore ?? 0) > ANTI_TOY_RELEASE_MAXIMUM).length, |
| scripts/check-external-product-value-benchmark.mjs | 212 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/check-external-product-value-benchmark.mjs | 213 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | console.log("EXTERNAL PRODUCT VALUE BENCHMARK CHECK"); |
| scripts/check-external-product-value-benchmark.mjs | 214 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | console.log(`Products reviewed: ${report.productsReviewed}`); |
| scripts/check-external-product-value-benchmark.mjs | 215 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | console.log(`Gold-standard claims reviewed: ${report.goldClaimsReviewed}`); |
| scripts/check-external-product-value-benchmark.mjs | 216 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | console.log(`External benchmarks missing: ${evidenceCounts.benchmarksMissingForGold}`); |
| scripts/check-external-product-value-benchmark.mjs | 217 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | console.log(`Rendered-output reviews missing: ${evidenceCounts.renderedReviewsMissingForGold}`); |
| scripts/check-external-product-value-benchmark.mjs | 218 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | console.log(`Live-route proof missing for gold: ${evidenceCounts.liveRouteProofMissingForGold}`); |
| scripts/check-report-as-evidence-violations.mjs | 30 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | reason: "Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence.", |
| scripts/check-report-as-evidence-violations.mjs | 31 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | context: line.trim(), |
| scripts/check-report-as-evidence-violations.mjs | 32 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | }); |
| scripts/check-report-as-evidence-violations.mjs | 118 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | \| File \| Line \| Context \| |
| scripts/check-report-as-evidence-violations.mjs | 119 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | \| --- \| ---: \| --- \| |
| scripts/check-surface-claim-authority.mjs | 28 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | } |
| scripts/check-surface-claim-authority.mjs | 29 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/check-surface-claim-authority.mjs | 30 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const surfaceClaimsData = loadJson(join(REPORTS_DIR, "product-surface-claims-focused.json")); |
| scripts/check-surface-claim-authority.mjs | 31 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const claimAuthorityData = loadJson(join(REPORTS_DIR, "universal-claim-authority-gate.json")); |
| scripts/check-surface-claim-authority.mjs | 32 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/check-surface-claim-authority.mjs | 33 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | if (!surfaceClaimsData) { |
| scripts/check-surface-claim-authority.mjs | 34 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | console.error("FAILED: Could not load surface claims data"); |
| scripts/check-surface-claim-authority.mjs | 118 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | // Write report |
| scripts/check-surface-claim-authority.mjs | 119 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | mkdirSync(REPORTS_DIR, { recursive: true }); |
| scripts/check-surface-claim-authority.mjs | 120 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | writeFileSync( |
| scripts/check-surface-claim-authority.mjs | 121 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | join(REPORTS_DIR, "surface-claim-authority-gate.json"), |
| scripts/check-surface-claim-authority.mjs | 122 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | JSON.stringify(result, null, 2) + "\n" |
| scripts/check-surface-claim-authority.mjs | 123 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | ); |
| scripts/check-surface-claim-authority.mjs | 124 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/check-universal-claim-authority.mjs | 144 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | // Write report |
| scripts/check-universal-claim-authority.mjs | 145 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | mkdirSync(REPORTS_DIR, { recursive: true }); |
| scripts/check-universal-claim-authority.mjs | 146 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | writeFileSync( |
| scripts/check-universal-claim-authority.mjs | 147 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | join(REPORTS_DIR, "universal-claim-authority-gate.json"), |
| scripts/check-universal-claim-authority.mjs | 148 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | JSON.stringify(result, null, 2) + "\n" |
| scripts/check-universal-claim-authority.mjs | 149 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | ); |
| scripts/check-universal-claim-authority.mjs | 150 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/check-universal-product-gold-standard-98.mjs | 206 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | })), |
| scripts/check-universal-product-gold-standard-98.mjs | 207 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | scoreDistribution: scoreDistribution(results), |
| scripts/check-universal-product-gold-standard-98.mjs | 208 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | remainingRisks: [ |
| scripts/check-universal-product-gold-standard-98.mjs | 209 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | "Report experience remains AMBER, so paid report-like products cannot claim 9.8 gold-standard release.", |
| scripts/check-universal-product-gold-standard-98.mjs | 210 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | "Live-cycle proof remains pending across delivery classes.", |
| scripts/check-universal-product-gold-standard-98.mjs | 211 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | "Stripe/webhook authority remains unresolved for paid checkout-dependent products.", |
| scripts/check-universal-product-gold-standard-98.mjs | 212 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | "Most product contracts now function as blocking authorities until actual artefact, journey, and delivery proof reaches 98/100.", |
| scripts/check-wave-one-gold-standard.mjs | 42 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | * roadmap), before Wave 1. Kept static so "before" remains a historical |
| scripts/check-wave-one-gold-standard.mjs | 43 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | * fact across re-runs. |
| scripts/check-wave-one-gold-standard.mjs | 44 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | */ |
| scripts/check-wave-one-gold-standard.mjs | 125 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/check-wave-one-gold-standard.mjs | 126 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const ENGINE_PATH = "lib/product/wave-one-gold-standard.ts"; |
| scripts/check-wave-one-gold-standard.mjs | 127 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const ENGINE_REQUIRED_MARKERS = [ |
| scripts/check-wave-one-gold-standard.mjs | 128 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | "WAVE_ONE_PRODUCTS", |
| scripts/check-wave-one-gold-standard.mjs | 129 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | "WaveOneUniversalOutput", |
| scripts/reconcile-product-authority-truth.mjs | 45 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | whyUnsupportedOrOverstated: "Current ProductAuthorityContract is legacy_validated_pending_v2_revalidation and the reconciliation found no matching product-specific ledger/runtime artifact set.", |
| scripts/reconcile-product-authority-truth.mjs | 46 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | correctedClassification: "pending_reconciliation", |
| scripts/reconcile-product-authority-truth.mjs | 48 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | productAuthorityAffected: true, |
| scripts/reconcile-product-authority-truth.mjs | 49 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | }, |
| scripts/reconcile-product-authority-truth.mjs | 50 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | { |
| scripts/reconcile-product-authority-truth.mjs | 51 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | reportFile: "reports/WAVE_2D_TEAM_ASSESSMENT_CLEAN_VALIDATION_DECISION_REPORT.md", |
| scripts/reconcile-product-authority-truth.mjs | 52 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | claimMade: "Team Assessment clean validation decision supports authority restoration.", |
| scripts/reconcile-product-authority-truth.mjs | 53 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | whyUnsupportedOrOverstated: "Evidence Ledger v2 proposes a stronger state than the current contract and the rendered output artifact/hash could not be independently verified by this pass.", |
| scripts/reconcile-product-authority-truth.mjs | 54 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | correctedClassification: "ledger_contract_mismatch", |
| scripts/reconcile-product-authority-truth.mjs | 56 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | productAuthorityAffected: true, |
| scripts/reconcile-product-authority-truth.mjs | 57 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | }, |
| scripts/reconcile-product-authority-truth.mjs | 58 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | { |
| scripts/reconcile-product-authority-truth.mjs | 59 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | reportFile: "reports/WAVE_2D_TEAM_ASSESSMENT_AUTHORITY_UPGRADE_CLOSURE_REPORT.md", |
| scripts/reconcile-product-authority-truth.mjs | 60 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | claimMade: "Team Assessment authority upgrade complete.", |
| scripts/reconcile-product-authority-truth.mjs | 61 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | whyUnsupportedOrOverstated: "Current ProductAuthorityContract remains legacy_validated_pending_v2_revalidation; ledger proposes externally_proven_gold_product.", |
| scripts/reconcile-product-authority-truth.mjs | 62 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | correctedClassification: "pending_reconciliation", |
| scripts/reconcile-product-authority-truth.mjs | 64 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | productAuthorityAffected: true, |
| scripts/reconcile-product-authority-truth.mjs | 65 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | }, |
| scripts/reconcile-product-authority-truth.mjs | 66 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | { |
| scripts/reconcile-product-authority-truth.mjs | 67 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | reportFile: "reports/WAVE_BOARD_PRODUCTS_HARDENING_INFRASTRUCTURE_REPORT.md", |
| scripts/reconcile-product-authority-truth.mjs | 69 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | whyUnsupportedOrOverstated: "lib/board/evidence-governance.ts exists but is not imported by runtime board engines; board-facing language guard fails.", |
| scripts/reconcile-product-authority-truth.mjs | 70 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | correctedClassification: "INFRASTRUCTURE-ONLY; NOT PRODUCT-HARDENED; NOT RUNTIME-WIRED; NOT VALIDATION-READY", |
| scripts/reconcile-product-authority-truth.mjs | 167 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | console.log(`Products reconciled: ${result.productsReconciled}`); |
| scripts/reconcile-product-authority-truth.mjs | 372 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | \| Report File \| Claim Made \| Why Unsupported Or Overstated \| Corrected Classification \| Required Amendment \| Product Authority Affected \| |
| scripts/reconcile-product-authority-truth.mjs | 373 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | \| --- \| --- \| --- \| --- \| --- \| ---: \| |
| scripts/reconcile-product-authority-truth.mjs | 374 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | ${rows.map((row) => `\| ${row.reportFile} \| ${escapeMd(row.claimMade)} \| ${escapeMd(row.whyUnsupportedOrOverstated)} \| ${row.correctedClassification} \| ${escapeMd(row.requiredAmendment)} \| ${row.productAuthorityAffected ? "yes" : "no"} \|`).join("\n")} |
| scripts/reconcile-product-authority-truth.mjs | 375 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | `; |
| scripts/reconcile-product-authority-truth.mjs | 376 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | } |
| scripts/reconcile-product-authority-truth.mjs | 377 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/run-external-product-value-benchmark.ts | 33 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | import { composeEnterpriseAssessmentGoldResult } from "../lib/product/enterprise-assessment-gold-composer"; |
| scripts/run-external-product-value-benchmark.ts | 34 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | import { |
| scripts/run-external-product-value-benchmark.ts | 35 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | captureRequiredWaveOneLiveRouteOutputs, |
| scripts/run-external-product-value-benchmark.ts | 36 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | WAVE_ONE_ROUTE_DISCOVERY, |
| scripts/run-external-product-value-benchmark.ts | 39 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/run-external-product-value-benchmark.ts | 40 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const ROOT = join(__dirname, ".."); |
| scripts/run-external-product-value-benchmark.ts | 41 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const EVIDENCE_PATH = join(ROOT, "reports", "external-product-value-evidence.json"); |
| scripts/run-external-product-value-benchmark.ts | 42 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const WAVE_ONE_REPORT = join(ROOT, "reports", "wave-one-gold-standard.json"); |
| scripts/run-external-product-value-benchmark.ts | 43 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/run-external-product-value-benchmark.ts | 44 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | // ── Gold claims under re-test (internal certifications from Wave 1) ── |
| scripts/run-external-product-value-benchmark.ts | 45 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const waveOne = existsSync(WAVE_ONE_REPORT) |
| scripts/run-external-product-value-benchmark.ts | 46 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | ? JSON.parse(readFileSync(WAVE_ONE_REPORT, "utf-8")) |
| scripts/run-external-product-value-benchmark.ts | 47 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | : null; |
| scripts/run-external-product-value-benchmark.ts | 48 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const goldClaims: string[] = (waveOne?.results ?? []) |
| scripts/run-external-product-value-benchmark.ts | 49 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | .filter((result: { releaseStatus: string }) => |
| scripts/run-external-product-value-benchmark.ts | 519 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | goldClaimsSource: "reports/wave-one-gold-standard.json (Wave 1 internal certification)", |
| scripts/run-external-product-value-benchmark.ts | 520 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | goldClaims, |
| scripts/run-external-product-value-benchmark.ts | 521 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | productsReviewed: descriptors.length, |
| scripts/run-external-product-value-benchmark.ts | 522 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | liveRouteDiscovery: WAVE_ONE_ROUTE_DISCOVERY, |
| scripts/run-external-product-value-benchmark.ts | 523 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | liveRouteCaptures, |
| scripts/scan-product-surface-claims.ts | 62 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| scripts/scan-product-surface-claims.ts | 63 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | // Get claim authority |
| scripts/scan-product-surface-claims.ts | 64 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const claimAuthorityReport = readFileSync( |
| scripts/scan-product-surface-claims.ts | 65 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | join(REPORTS_DIR, "universal-claim-authority-gate.json"), |
| scripts/scan-product-surface-claims.ts | 66 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | "utf-8" |
| scripts/scan-product-surface-claims.ts | 67 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | ); |
| scripts/scan-product-surface-claims.ts | 68 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const authorityData = JSON.parse(claimAuthorityReport); |
| scripts/test-authority-fraud-scenarios.mjs | 45 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | id: "report_complete_contract_pending", |
| scripts/test-authority-fraud-scenarios.mjs | 46 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | description: "report says complete but contract still pending", |
| scripts/test-authority-fraud-scenarios.mjs | 47 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | declaredAuthorityState: "legacy_validated_pending_v2_revalidation", |
| scripts/test-authority-fraud-scenarios.mjs | 48 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | reportClaimsComplete: true, |
| scripts/test-authority-fraud-scenarios.mjs | 49 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | checks: checksExcept([]), |
| scripts/test-authority-fraud-scenarios.mjs | 50 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | }, |
| scripts/test-authority-fraud-scenarios.mjs | 51 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | { |
| scripts/update-executive-reporting-grade.mjs | 20 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | er.knownBlockers = []; |
| scripts/update-executive-reporting-grade.mjs | 21 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | if (!er.testsCoveringIt) er.testsCoveringIt = []; |
| scripts/update-executive-reporting-grade.mjs | 22 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | er.testsCoveringIt.push( |
| lib/admin/product-surface-registry.ts | 189 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | systemOfRecord: "DECISION_CENTRE", |
| lib/admin/product-surface-registry.ts | 190 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | provenanceCapable: true, |
| lib/admin/product-surface-registry.ts | 191 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | }, |
| lib/admin/product-surface-registry.ts | 192 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | description: "Tests governance readiness and authority structure before pricing consequences. Intermediate step between Fast Diagnostic and Executive Reporting.", |
| lib/admin/product-surface-registry.ts | 193 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | }, |
| lib/admin/product-surface-registry.ts | 194 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| lib/admin/product-surface-registry.ts | 195 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | // ── ASSESSMENTS ────────────────────────────────────────────────────────── |
| lib/admin/reporting/canonical-report-contract.ts | 186 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | safeString(constitution?.orgState, "DRIFTING"), |
| lib/admin/reporting/canonical-report-contract.ts | 187 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | ) as ExecutiveReportState, |
| lib/admin/reporting/canonical-report-contract.ts | 188 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | readinessTier: safeString(constitution?.readinessTier, "EMERGING") as ExecutiveReportReadinessTier, |
| lib/admin/reporting/canonical-report-contract.ts | 189 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | authorityType: safeString(constitution?.authorityType, "UNCLEAR") as ExecutiveReportAuthorityType, |
| lib/admin/reporting/canonical-report-contract.ts | 190 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | revenueBand: safeString(constitution?.revenueBand, "SMB") as ExecutiveReportRevenueBand, |
| lib/admin/reporting/canonical-report-contract.ts | 191 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | marketRiskBand: safeString(constitution?.marketRiskBand, "MEDIUM") as ExecutiveReportMarketRiskBand, |
| lib/admin/reporting/executive-report-serializer.ts | 163 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | guidanceConstitution.readinessTier \|\| |
| lib/admin/reporting/executive-report-serializer.ts | 164 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | reportConstitution.readinessTier |
| lib/admin/reporting/executive-report-service.ts | 209 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | posture: safeString(report?.state, "DRIFTING") as any, |
| lib/admin/reporting/executive-report-service.ts | 210 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | confidence: clamp(certainty, 0, 100), |
| lib/admin/reporting/executive-report-service.ts | 211 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | readinessTier: report?.state === "ORDERED" ? "EXECUTION_READY" : report?.state === "DISORDERED" ? "FRAGILE" : "STABILIZING", |
| lib/admin/reporting/executive-report-service.ts | 212 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | authorityType: args.participantCount >= 12 ? "DIRECT" : args.participantCount >= 7 ? "PROXY" : "UNCLEAR", |
| lib/admin/reporting/executive-report-service.ts | 213 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | revenueBand: |
| lib/admin/reporting/executive-report-service.ts | 214 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | totalExposure >= 1_000_000 |
| lib/admin/reporting/types.ts | 76 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | orgState: ExecutiveReportState; |
| lib/admin/reporting/types.ts | 77 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | posture: ExecutiveReportState; |
| lib/admin/reporting/types.ts | 78 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | readinessTier: ExecutiveReportReadinessTier; |
| lib/admin/reporting/types.ts | 79 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | authorityType: ExecutiveReportAuthorityType; |
| lib/admin/reporting/types.ts | 80 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | revenueBand: ExecutiveReportRevenueBand; |
| lib/admin/reporting/types.ts | 81 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | marketRiskBand: ExecutiveReportMarketRiskBand; |
| lib/admin/reporting/types.ts | 123 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | orgState: ExecutiveReportState; |
| lib/admin/reporting/types.ts | 124 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | posture: ExecutiveReportState; |
| lib/admin/reporting/types.ts | 125 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | readinessTier: ExecutiveReportReadinessTier; |
| lib/admin/reporting/types.ts | 126 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | authorityType: ExecutiveReportAuthorityType; |
| lib/admin/reporting/types.ts | 127 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | revenueBand: ExecutiveReportRevenueBand; |
| lib/admin/reporting/types.ts | 128 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | marketRiskBand: ExecutiveReportMarketRiskBand; |
| lib/commercial/catalog.ts | 833 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | includes: [], |
| lib/commercial/catalog.ts | 834 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | shortDescription: "Tests organisational dependencies, exposure, authority, evidence, and scenario stress.", |
| lib/commercial/catalog.ts | 835 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | userPromise: "Produces a structural organisational reading: authority, evidence, dependency, and escalation exposure.", |
| lib/commercial/catalog.ts | 836 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | pricingNote: "Free organisational assessment — qualifies readiness, authority gaps, dependencies, and oversight potential. Next: Executive Reporting, Strategy Room, or Retainer Review.", |
| lib/commercial/catalog.ts | 837 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | primaryCta: "Start Enterprise Assessment", |
| lib/commercial/catalog.ts | 838 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | upgradePath: ["executive_reporting", "strategy_room"], |
| lib/commercial/catalog.ts | 839 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | hiddenFromPricing: true, |
| lib/decision/constitutional-guidance-assembler.ts | 373 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | orgState: safeString(derived.orgState, "DRIFTING") as import("@/lib/admin/reporting/types").ExecutiveReportState, |
| lib/decision/constitutional-guidance-assembler.ts | 374 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | posture: safeString(derived.orgState, "DRIFTING") as import("@/lib/admin/reporting/types").ExecutiveReportState, |
| lib/decision/constitutional-guidance-assembler.ts | 375 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | readinessTier: safeString(derived.readinessTier, "EMERGING") as import("@/lib/admin/reporting/types").ExecutiveReportReadinessTier, |
| lib/decision/constitutional-guidance-assembler.ts | 376 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | authorityType: safeString(derived.authorityType, "UNCLEAR") as import("@/lib/admin/reporting/types").ExecutiveReportAuthorityType, |
| lib/decision/constitutional-guidance-assembler.ts | 377 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | revenueBand: safeString(derived.revenueBand, "SMB") as import("@/lib/admin/reporting/types").ExecutiveReportRevenueBand, |
| lib/decision/constitutional-guidance-assembler.ts | 378 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | marketRiskBand: safeString(derived.marketRiskBand, "MODERATE") as import("@/lib/admin/reporting/types").ExecutiveReportMarketRiskBand, |
| lib/diagnostics/constitutional-bridge.ts | 204 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | `We are facing a ${severity} structural issue.`, |
| lib/diagnostics/constitutional-bridge.ts | 205 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | `Current posture reads as ${report.posture}.`, |
| lib/diagnostics/constitutional-bridge.ts | 206 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | `Authority type reads as ${report.authorityType}.`, |
| lib/diagnostics/constitutional-bridge.ts | 207 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | `Readiness tier reads as ${report.readinessTier}.`, |
| lib/diagnostics/constitutional-bridge.ts | 208 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | `The constitutional route currently resolves to ${decision.route}.`, |
| lib/diagnostics/constitutional-bridge.ts | 209 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | `We need disciplined interpretation of friction, authority, and decision sequence before proceeding further.`, |
| lib/diagnostics/constitutional-bridge.ts | 210 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | ].join(" "); |
| lib/diagnostics/constitutional-bridge.ts | 228 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | frictionScore: report.frictionScore, |
| lib/diagnostics/constitutional-bridge.ts | 229 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | trustScore: report.trustScore, |
| lib/diagnostics/constitutional-bridge.ts | 230 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | posture: report.posture, |
| lib/diagnostics/constitutional-bridge.ts | 231 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | readinessTier: report.readinessTier, |
| lib/diagnostics/constitutional-bridge.ts | 232 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | authorityType: report.authorityType, |
| lib/diagnostics/constitutional-bridge.ts | 233 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | seriousnessScore: report.seriousnessScore, |
| lib/diagnostics/constitutional-bridge.ts | 234 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | }, |
| lib/diagnostics/constitutional-bridge.ts | 244 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | constitutionalRoute: decision.route, |
| lib/diagnostics/constitutional-bridge.ts | 245 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | posture: report.posture, |
| lib/diagnostics/constitutional-bridge.ts | 246 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | readinessTier: report.readinessTier, |
| lib/diagnostics/constitutional-bridge.ts | 247 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | authorityType: report.authorityType, |
| lib/diagnostics/constitutional-bridge.ts | 248 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | principalRisks, |
| lib/diagnostics/constitutional-bridge.ts | 249 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | priorityInterventions, |
| lib/diagnostics/constitutional-bridge.ts | 257 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | confidence: decision.confidence, |
| lib/diagnostics/constitutional-bridge.ts | 258 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | posture: report.posture, |
| lib/diagnostics/constitutional-bridge.ts | 259 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | readinessTier: report.readinessTier, |
| lib/diagnostics/constitutional-bridge.ts | 260 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | authorityType: report.authorityType, |
| lib/diagnostics/constitutional-bridge.ts | 261 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | escalationAllowed: decision.escalationAllowed, |
| lib/diagnostics/constitutional-bridge.ts | 262 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | }, |
| lib/diagnostics/constitutional-diagnostic-derivation.ts | 450 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | return { |
| lib/diagnostics/constitutional-diagnostic-derivation.ts | 451 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | clarityScore: report.coherenceScore, |
| lib/diagnostics/constitutional-diagnostic-derivation.ts | 452 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | authorityType: report.authorityType, |
| lib/diagnostics/constitutional-diagnostic-derivation.ts | 453 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | readinessTier: report.readinessTier, |
| lib/diagnostics/constitutional-diagnostic-derivation.ts | 454 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | posture: report.posture, |
| lib/diagnostics/constitutional-diagnostic-derivation.ts | 455 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | failureModeCount: report.failureModeCount, |
| lib/diagnostics/constitutional-evidence-bridge.ts | 386 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | source: "constitutional_diagnostic", |
| lib/diagnostics/constitutional-evidence-bridge.ts | 387 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | route: decision.route, |
| lib/diagnostics/constitutional-evidence-bridge.ts | 388 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | readinessTier: report.readinessTier, |
| lib/diagnostics/constitutional-evidence-bridge.ts | 389 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | authorityType: report.authorityType, |
| lib/diagnostics/constitutional-evidence-bridge.ts | 390 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | posture: report.posture, |
| lib/diagnostics/constitutional-evidence-bridge.ts | 391 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| lib/diagnostics/constitutional-evidence-bridge.ts | 402 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | }, |
| lib/diagnostics/constitutional-evidence-bridge.ts | 403 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| lib/intelligence/constitutional-orchestrator-adapter.ts | 57 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | // Extract posture from report |
| lib/intelligence/constitutional-orchestrator-adapter.ts | 58 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const posture = derivePosture(report) |
| lib/product/constitutional-living-adapter.ts | 124 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | currentSessionSignals: [ |
| lib/product/constitutional-living-adapter.ts | 125 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | { signal: `Authority type: ${report.authorityType}` }, |
| lib/product/constitutional-living-adapter.ts | 126 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | { signal: `Posture: ${report.posture}` }, |
| lib/product/constitutional-living-adapter.ts | 127 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | { signal: `Readiness: ${report.readinessTier}` }, |
| lib/product/constitutional-living-adapter.ts | 128 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | ...report.keyFindings.map(f => ({ signal: f })), |
| lib/product/constitutional-living-adapter.ts | 329 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| lib/product/constitutional-living-adapter.ts | 330 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | entries.push({ |
| lib/product/constitutional-living-adapter.ts | 331 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | label: 'Constitutional Diagnostic completed', |
| lib/product/constitutional-living-adapter.ts | 332 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | summary: `Route: ${decision.route}. Authority: ${report.authorityType}. Posture: ${report.posture}. Readiness: ${report.readinessTier}.`, |
| lib/product/constitutional-living-adapter.ts | 333 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | timestamp: '', |
| lib/product/constitutional-living-adapter.ts | 334 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | }) |
| lib/product/constitutional-living-adapter.ts | 335 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| lib/product/constitutional-living-adapter.ts | 373 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| lib/product/constitutional-living-adapter.ts | 374 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | newEvidence.push(`Authority type: ${report.authorityType}`) |
| lib/product/constitutional-living-adapter.ts | 375 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | newEvidence.push(`Posture: ${report.posture}`) |
| lib/product/constitutional-living-adapter.ts | 376 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | newEvidence.push(`Readiness: ${report.readinessTier}`) |
| lib/product/constitutional-living-adapter.ts | 377 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| lib/product/constitutional-living-adapter.ts | 378 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | if (constitutionalStructural?.approvingAuthority) { |
| lib/product/constitutional-living-adapter.ts | 379 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | newEvidence.push(`Approving authority: ${constitutionalStructural.approvingAuthority}`) |
| lib/product/live-route-output-capture.ts | 48 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| lib/product/live-route-output-capture.ts | 49 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | const SCENARIOS_BY_ID = new Map(GOLDEN_DECISION_SCENARIOS.map((scenario) => [scenario.id, scenario])); |
| lib/product/live-route-output-capture.ts | 50 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| lib/product/live-route-output-capture.ts | 51 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | export const WAVE_ONE_ROUTE_DISCOVERY: WaveOneRouteDiscovery[] = [ |
| lib/product/live-route-output-capture.ts | 52 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | { |
| lib/product/wave-one-gold-standard.ts | 37 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | * The explicit Wave 1 product list. Membership is deliberate: these are the |
| lib/product/wave-one-gold-standard.ts | 146 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | \| "time_value_surplus" |
| lib/product/wave-one-gold-standard.ts | 147 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | \| "reuse_value"; |
| lib/product/wave-one-gold-standard.ts | 159 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | "reuse_value", |
| lib/product/wave-one-gold-standard.ts | 160 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | ]; |
| lib/product/wave-one-gold-standard.ts | 161 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| lib/product/wave-one-gold-standard.ts | 162 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | export const WAVE_ONE_GOLD_THRESHOLD = 9.8; |
| lib/product/wave-one-gold-standard.ts | 163 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | export const WAVE_ONE_CRITICAL_DIMENSION_MINIMUM = 9.5; |
| lib/product/wave-one-gold-standard.ts | 164 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |
| lib/product/wave-one-gold-standard.ts | 165 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | /** |
| lib/product/wave-one-gold-standard.ts | 166 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | * Wave 1 can certify internally only. Internal certification is necessary |
| lib/reporting/report-experience-gold-standard.ts | 58 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | visualAuthority: ReportExperienceScore; |
| lib/reporting/report-experience-gold-standard.ts | 59 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | mobileReadability: ReportExperienceScore; |
| lib/reporting/report-experience-gold-standard.ts | 60 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | pdfReadability: ReportExperienceScore; |
| lib/reporting/report-experience-gold-standard.ts | 61 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | archiveReadiness: ReportExperienceScore; |
| lib/research/engines/constitutional-diagnostic-adapter.ts | 158 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | inputs: { |
| lib/research/engines/constitutional-diagnostic-adapter.ts | 159 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | authorityType: report.authorityType, |
| lib/research/engines/constitutional-diagnostic-adapter.ts | 160 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | posture: report.posture, |
| lib/research/engines/constitutional-diagnostic-adapter.ts | 161 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | readinessTier: report.readinessTier, |
| lib/research/engines/constitutional-diagnostic-adapter.ts | 162 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | failureModeCount: report.failureModeCount, |
| lib/research/engines/constitutional-diagnostic-adapter.ts | 264 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | confidence: decision.confidence, |
| lib/research/engines/constitutional-diagnostic-adapter.ts | 265 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | posture: report.posture, |
| lib/research/engines/constitutional-diagnostic-adapter.ts | 266 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | readinessTier: report.readinessTier, |
| lib/research/engines/constitutional-diagnostic-adapter.ts | 267 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | authorityType: report.authorityType, |
| lib/research/engines/constitutional-diagnostic-adapter.ts | 268 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | authorityScore: report.authorityScore, |
| lib/research/engines/constitutional-diagnostic-adapter.ts | 269 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | coherenceScore: report.coherenceScore, |
| lib/server/strategy-room/access.server.ts | 106 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | email: normalizeEmail(report.email), |
| lib/server/strategy-room/access.server.ts | 107 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | route: report.route ?? null, |
| lib/server/strategy-room/access.server.ts | 108 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | readinessTier: report.readinessTier ?? null, |
| lib/server/strategy-room/access.server.ts | 109 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | authorityType: report.authorityType ?? null, |
| lib/server/strategy-room/access.server.ts | 110 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | }; |
| lib/server/strategy-room/access.server.ts | 111 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | } |
| pages/api/diagnostics/constitutional-intake/report.ts | 255 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | confidence: result.bundle.decision.confidence, |
| pages/api/diagnostics/constitutional-intake/report.ts | 256 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | posture: result.bundle.report.posture, |
| pages/api/diagnostics/constitutional-intake/report.ts | 257 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | readinessTier: result.bundle.report.readinessTier, |
| pages/api/diagnostics/constitutional-intake/report.ts | 258 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | authorityType: result.bundle.report.authorityType, |
| pages/api/diagnostics/constitutional-intake/report.ts | 259 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | seriousnessScore: result.bundle.report.seriousnessScore, |
| pages/api/diagnostics/constitutional-intake/report.ts | 260 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | completionPercent: result.bundle.report.completionPercent, |
| pages/changelog.tsx | 49 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | date: "2025-05-16", |
| pages/decision-instruments/[slug].tsx | 283 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | guidedChecklist: ["Assess evidence depth.", "Rate consequence severity.", "Evaluate authority clarity.", "Identify execution blockage.", "Check for recurrence signals."], |
| pages/decision-instruments/[slug].tsx | 284 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | completionPrompt: "Mark complete after escalation readiness and recommended path are classified.", |
| pages/decision-instruments/[slug].tsx | 285 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | consequenceIfSkipped: ["Escalation may be attempted without evidence — reducing credibility", "Premature escalation wastes executive attention", "Overdue escalation allows conditions to worsen"], |
| pages/decision-instruments/[slug].tsx | 286 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. | transition: { state: "STRUCTURAL_CONDITION", label: "Escalation readiness classified.", body: "Use Executive Reporting to price the full institutional consequence.", cta: `Executive Reporting`, href: "/diagnostics/executive-reporting" }, |
| pages/verification.tsx | 174 | Authority-related logic references completion/readiness/WAVE report context; reports must not constitute evidence. |  |

## Generated Report Authority Claims Sample

| File | Line | Context |
| --- | ---: | --- |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 1 | # Authority Surface Integration — Completion Report |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 4 | **Status:** COMPLETE ✓ |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 10 | **Objective:** Make evidence-governed authority visible and binding across all user-facing surfaces |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 12 | **Result:** Authority UI components deployed and integrated |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 14 | All surfaces can now consume ProductAuthorityContract to display authority state. No surface may claim authority except through the contract. |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 20 | ### 1. ProductAuthorityBadge.tsx |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 21 | **Location:** `components/product/ProductAuthorityBadge.tsx` |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 23 | Displays product authority state as a colored badge. |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 26 | - `ProductAuthorityState` from contract |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 29 | - Green badge for `externally_proven_gold_product` |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 31 | - Orange badge for `legacy_validated_pending_v2_revalidation` |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 36 | **Does NOT accept hardcoded strings** like "gold", "proven", "validated" |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 40 | ### 2. ProductAuthorityPanel.tsx |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 41 | **Location:** `components/product/ProductAuthorityPanel.tsx` |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 43 | Displays complete authority details with expandable detail section. |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 46 | - Authority state (with title) |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 76 | ### 4. ProductAuthorityNotice.tsx |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 77 | **Location:** `components/product/ProductAuthorityNotice.tsx` |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 79 | Displays notices about authority limitations and required actions. |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 82 | - Authority is limited or blocked |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 89 | - Info style (blue) for limited authority |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 101 | **File:** `scripts/check-authority-surface-integration.mjs` |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 111 | - Hardcoded authority claims (paired with product name + authority language) |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 112 | - Unsupported authority terms in descriptions (board-grade, market-leading, etc.) |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 127 | ## Product Authority States — Display Ready |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 132 | Badge:  Externally Proven |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 134 | Panel:  Authority State: externally_proven_gold_product |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 137 | Language: "fast_diagnostic is externally proven under v2 evidence validation." |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 146 | Panel:  Authority State: legacy_validated_pending_v2_revalidation |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 149 | Language: "team_assessment is legacy validated; pending v2 revalidation." |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 150 | Notice:   "Legacy Authority — Requires v2 revalidation for continued claims" |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 152 | Action:   Run v2 revalidation to upgrade from legacy status |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 160 | Panel:  Authority State: legacy_validated_pending_v2_revalidation |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 163 | Language: "enterprise_assessment is legacy validated; pending v2 revalidation." |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 164 | Notice:   "Legacy Authority — Requires v2 revalidation for continued claims" |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 166 | Action:   Run v2 revalidation to upgrade from legacy status |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 174 | Panel:  Authority State: blocked_until_claim_evidenced |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 179 | Notice:   "Authority Blocked — No authority to make diagnostic/intelligence claims" |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 192 | import { ProductAuthorityPanel } from "@/components/product/ProductAuthorityPanel"; |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 193 | import { resolveProductAuthority } from "@/lib/product/resolve-product-authority"; |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 196 | const contract = resolveProductAuthority({ |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 205 | <ProductAuthorityPanel contract={contract} /> |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 207 | <ProductAuthorityNotice contract={contract} /> |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 212 | // ✗ INCORRECT: Hardcoded authority |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 214 | return <div>Fast Diagnostic is proven</div>; // BLOCKED by integration gate |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 222 | ### ✓ Product Authority Contract Gate |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 230 | ### ✓ Authority Surface Integration Gate |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 239 | ### ✓ No-Mock Authority Gate |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 241 | Mock authority patterns: 0 found in library code |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 242 | Hardcoded authority: 0 in library code |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 246 | ### ✓ Surface Claim Authority Gate |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 277 | 1. **components/product/ProductAuthorityBadge.tsx** (65 lines) |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 278 | - Authority state badge component |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 279 | - Color-coded by authority state |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 282 | 2. **components/product/ProductAuthorityPanel.tsx** (200+ lines) |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 283 | - Detailed authority information display |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 292 | 4. **components/product/ProductAuthorityNotice.tsx** (180+ lines) |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 293 | - Authority limitation notices |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 297 | 5. **scripts/check-authority-surface-integration.mjs** (230+ lines) |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 304 | 1. **scripts/check-no-mock-authority.mjs** |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 310 | ## Authority Display Rules |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 313 | All authority language must come from `ProductAuthorityContract.publicClaimLanguage` or `ProductAuthorityContract.currentAuthorityState`. |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 319 | When `contract.blockingReasons.length > 0`, display `ProductAuthorityNotice`. |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 322 | When showing authority state, include evidence source and validation status. |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 332 | 1. ✓ Authority UI components exist |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 333 | 2. ✓ Product surfaces can consume ProductAuthorityContract |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 334 | 3. ✓ Components do not accept arbitrary authority strings |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 335 | 4. ✓ fast_diagnostic can display v2-proven authority |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 339 | 8. ✓ Admin/dashboard surfaces can expose authority state |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 340 | 9. ✓ Authority surface integration gate passes |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 341 | 10. ✓ No critical violations of authority display rules |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 348 | - Add ProductAuthorityPanel to admin product detail pages |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 353 | - Add Authority Status block to all generated reports |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 358 | - Update product cards to use ProductAuthorityBadge |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 360 | - Add ProductAuthorityNotice for limited authority products |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 368 | - Alert when product authority changes |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 376 | **No surface may independently decide a product's authority.** |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 378 | Every claim about product validation, proof, diagnostic capability, or intelligence must derive from and be accountable to the ProductAuthorityContract. |
| reports/AUTHORITY_SURFACE_INTEGRATION_COMPLETION.md | 380 | The user, buyer, operator, admin, and reader now encounter evidence-governed authority wherever they see a product, claim, report, or diagnostic artifact. |
| reports/category-demonstration-readiness.md | 13 | - Final Authority Position: Estate category demonstration may be claimed. |
| reports/category-demonstration-readiness.md | 18 | - Routes demonstrating authority pattern: 4 |
| reports/category-demonstration-readiness.md | 19 | - Routes with authority visible: 4 |
| reports/category-dominance-readiness.md | 13 | The category infrastructure is materially present, but too much of it remains internal, report-bound, or admin-only. The market cannot yet see enough weak-evidence authority being made impossible in the core journeys. |
| reports/category-dominance-readiness.md | 18 | - Authority state visible: fast_diagnostic, decision_centre |
| reports/category-dominance-readiness.md | 25 | - Wire ProductAuthorityContract components into every customer-facing product route before making authority claims visible in copy. |
| reports/category-dominance-readiness.md | 29 | - Reduce duplication between validation reports and actual authority resolvers; gates should read the same source of truth routes consume. |
| reports/context-bound-validation-readiness.md | 20 | **Can Grant Authority from Synthetic Context:** NO |
| reports/context-bound-validation-readiness.md | 30 | - Isolated testing cannot establish authority |
| reports/context-bound-validation-readiness.md | 33 | **Authority Grant Eligible:** blocked_until_full_flow_complete |
| reports/context-bound-validation-readiness.md | 41 | **Can Grant Authority from Synthetic Context:** YES |
| reports/context-bound-validation-readiness.md | 43 | **Authority Grant Eligible:** eligible_from_isolated_validation |
| reports/context-bound-validation-readiness.md | 51 | **Can Grant Authority from Synthetic Context:** YES |
| reports/context-bound-validation-readiness.md | 53 | **Authority Grant Eligible:** eligible_from_isolated_validation |
| reports/context-bound-validation-readiness.md | 61 | **Can Grant Authority from Synthetic Context:** YES |
| reports/context-bound-validation-readiness.md | 63 | **Authority Grant Eligible:** eligible_from_isolated_validation |
| reports/context-bound-validation-readiness.md | 71 | **Can Grant Authority from Synthetic Context:** YES |
| reports/context-bound-validation-readiness.md | 73 | **Authority Grant Eligible:** eligible_from_isolated_validation |
| reports/living-case-admin-fulfilment-readiness.md | 53 | The fulfilment workflow has been proven through tests: |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 5 | **Status:** ✓ COMPLETE |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 7 | **Authority Preservation:** All product states unchanged |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 16 | **Scope:** Messaging and language improvements only. No component refactoring, no authority upgrades. |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 18 | **Result:** Two high-impact surfaces improved; blockers identified and documented for future work; all authority gates remain passing. |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 38 | \| team_assessment \| credible_but_too_complex \| authority_contract_not_visible \| /diagnostics/team-assessment \| |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 39 | \| enterprise_assessment \| credible_but_too_complex \| authority_contract_not_visible \| /diagnostics/enterprise-assessment, /enterprise-decision-scan \| |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 42 | \| boardroom_mode \| credible_but_too_complex \| authority_contract_not_visible, generic_ai_contrast_weak \| Boardroom Brief \| |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 43 | \| global_market_reports \| credible_but_too_complex \| authority_contract_not_visible, limitations_not_visible, generic_ai_contrast_weak \| /artifacts, /intelligence/market \| |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 63 | a decision has enough evidence, authority, and |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 73 | - Maintains authority visibility (already present from Stage 2E) |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 75 | **Entry Point Status:** Now shows pain (implicit), proof (authority panel), and action (test your decision). |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 81 | **Current Issue:** authority_contract_not_visible (and missing next-action clarity) |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 82 | **Fix Applied:** Added authority context section after ProductAuthorityPanel |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 88 | This scan surfaces risks and dependencies. Authority |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 91 | (externally proven) for governed decisions. |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 95 | - Makes authority state explicit and actionable |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 96 | - Shows what the assessment does (surfaces risks) vs what it doesn't do (prove authority) |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 97 | - Links users to v2-proven product (fast_diagnostic) for authority-based decisions |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 98 | - Prevents overclaiming: "authority depends on v2 validation" |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 100 | **Entry Point Status:** Now shows pain (enterprise risks), proof (authority state visible), action (use with fast_diagnostic). |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 110 | \| /diagnostics/team-assessment \| authority_contract_not_visible \| Medium \| Diagnostic page restructure (Wave 2) \| |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 113 | \| /boardroom-brief \| authority_contract + AI contrast \| Medium \| Multiple issues, requires Wave 2 \| |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 114 | \| /artifacts/GMI \| authority + limitations + AI contrast \| High \| Complex multi-surface issue \| |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 137 | - Authority boundary constraints (what NOT to claim) |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 142 | - Ensures future work preserves authority boundaries |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 147 | ## AUTHORITY PRESERVATION VERIFICATION |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 149 | ### Product Authority States (All Unchanged) |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 153 | \| fast_diagnostic \| externally_proven_gold_product \| externally_proven_gold_product \| ✓ UNCHANGED \| |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 154 | \| foundry_decision_test \| externally_proven_gold_product \| externally_proven_gold_product \| ✓ UNCHANGED \| |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 155 | \| team_assessment \| legacy_validated_pending_v2_revalidation \| legacy_validated_pending_v2_revalidation \| ✓ UNCHANGED \| |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 156 | \| enterprise_assessment \| legacy_validated_pending_v2_revalidation \| legacy_validated_pending_v2_revalidation \| ✓ UNCHANGED \| |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 157 | \| personal_decision_audit \| legacy_validated_pending_v2_revalidation \| legacy_validated_pending_v2_revalidation \| ✓ UNCHANGED \| |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 164 | - ✓ "externally proven" |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 165 | - ✓ "legacy validated, pending v2 revalidation" |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 168 | - ✗ No claims that legacy products are v2-proven |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 169 | - ✗ No false authority upgrades |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 175 | ### All Gates Passing |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 181 | ✓ Estate Authority Integrity Lock      PASSED (estate_category_demonstrated) |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 182 | ✓ Checkout Authority Coverage          PASSED (0 failures, 22 products audited) |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 183 | ✓ Report Authority Coverage            PASSED (0 failures, 12 products audited) |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 184 | ✓ Admin Authority Coverage             PASSED (0 failures, 33 products audited) |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 185 | ✓ No Mock Authority Validation         PASSED (0 mock sources) |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 186 | ✓ Surface Claim Authority              PASSED (0 unsupported claims) |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 199 | \| Mock authority sources \| 0 \| 0 \| — \| |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 212 | 2. `/enterprise-decision-scan` — Added authority context note (addresses authority_contract_not_visible) |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 218 | - `/test-your-decision` — Per-route authority visible |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 231 | \| Enterprise entry \| credible_but_too_complex \| ✓ Improved (authority context added) \| |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 246 | - ProductAuthorityContract integration into diagnostic flows |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 252 | - Admin authority visibility improvements |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 255 | 3. **Product Authority Upgrades** (Intentionally unchanged) |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 258 | - No unearned authority claims |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 274 | - `/enterprise-decision-scan`: authority state visible with context |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 275 | - `/test-your-decision`: per-route authority shown |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 280 | - Clear language: "Generic AI gives answers. This tests whether a decision deserves authority." |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 282 | ✓ **Authority transparency maintained:** |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 285 | - No false authority upgrades |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 292 | - Assessment entry points still need authority wiring |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 295 | - Marketing language improvements incomplete |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 311 | 1. Wire ProductAuthorityContract into team_assessment and enterprise_assessment diagnostics |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 313 | 3. Improve authority visibility in boardroom_mode surfaces |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 318 | 3. Global Market Reports: add authority state and limitations |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 333 | - `/enterprise-decision-scan`: Authority context clarification added |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 341 | 3. **Authority infrastructure integrity maintained** |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 343 | - No false authority upgrades |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 347 | - All authority gates passing |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 349 | - Surface claim authority clean |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 355 | **Estate Authority Status:** `estate_category_demonstrated` (maintained) |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 357 | Market Clarity Passes 1-2 have improved buyer-facing clarity without changing authority infrastructure: |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 361 | ✓ Authority state transparent where visible |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 367 | **What Did NOT Change:** Authority states, product validation status, governance model. |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 381 | ✓ node scripts/check-estate-authority-integrity.mjs         PASSED |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 382 | ✓ node scripts/audit-checkout-authority-coverage.mjs        PASSED |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 383 | ✓ node scripts/audit-report-authority-coverage.mjs          PASSED |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 384 | ✓ node scripts/audit-admin-authority-coverage.mjs           PASSED |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 385 | ✓ node scripts/check-no-mock-authority.mjs                  PASSED |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 386 | ✓ node scripts/check-surface-claim-authority.mjs            PASSED |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 405 | **Market Clarity Pass 2:** ✓ COMPLETE |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 407 | **Result:** Two high-impact surfaces enhanced with targeted buyer-facing clarity. Comprehensive blockers documentation created for Wave 2. All authority gates remain passing. Estate readiness maintained at estate_categor |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 414 | **Pass Status:** ✓ COMPLETE |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 415 | **Authority Preservation:** ✓ ALL STATES UNCHANGED |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 422 | **Authority Gates:** 9 of 9 passing |
| reports/MARKET_CLARITY_PASS_2_COMPLETION_REPORT.md | 424 | **Recommendation:** Market clarity improvements complete and honest. Estate authority infrastructure intact. Ready for independent Wave 2 validation and/or market positioning work. |
| reports/product-fulfilment-readiness.md | 27 | - ⚠ "boardroom_brief" has not completed a proof run — fulfilment path unverified in production |
| reports/product-fulfilment-readiness.md | 28 | - ℹ Proof run not yet completed end-to-end in production (paid → review → dossier_generated → delivered) |
| reports/product-fulfilment-readiness.md | 151 | - ⚠ "operator_decision_pack" has not completed a proof run — fulfilment path unverified in production |
| reports/product-fulfilment-readiness.md | 161 | - ⚠ "executive_reporting" has not completed a proof run — fulfilment path unverified in production |
| reports/product-fulfilment-readiness.md | 172 | - ⚠ "strategy_room" has not completed a proof run — fulfilment path unverified in production |
| reports/product-fulfilment-readiness.md | 184 | - ⚠ "strategy_room_extended" has not completed a proof run — fulfilment path unverified in production |
| reports/product-fulfilment-readiness.md | 251 | - ⚠ "professional" has not completed a proof run — fulfilment path unverified in production |
| reports/product-fulfilment-readiness.md | 263 | - ⚠ "professional_annual" has not completed a proof run — fulfilment path unverified in production |
| reports/product-fulfilment-readiness.md | 274 | - ⚠ "gmi_q1_2026" has not completed a proof run — fulfilment path unverified in production |
| reports/product-fulfilment-readiness.md | 297 | ### Decision Authority Retainer — Core (`retainer_core`) |
| reports/product-fulfilment-readiness.md | 305 | ### Decision Authority Retainer — Operational (`retainer_operational`) |
| reports/product-fulfilment-readiness.md | 313 | ### Decision Authority Retainer — Institutional (`retainer_institutional`) |
| reports/PRODUCT_AUTHORITY_CONTRACT_COMPLETION.md | 1 | # Product Authority Contract Implementation — Completion Report |
| reports/PRODUCT_AUTHORITY_CONTRACT_COMPLETION.md | 4 | **Status:** COMPLETE ✓ |
| reports/PRODUCT_AUTHORITY_CONTRACT_COMPLETION.md | 12 | **Result:** ProductAuthorityContract infrastructure deployed and operational |
| reports/PRODUCT_AUTHORITY_CONTRACT_COMPLETION.md | 14 | All 4 products now expose their authority state through a machine-readable contract derived from validation evidence. |
| reports/PRODUCT_AUTHORITY_CONTRACT_COMPLETION.md | 20 | ### ✓ 1. ProductAuthorityContract Type Definition |
| reports/PRODUCT_AUTHORITY_CONTRACT_COMPLETION.md | 21 | **File:** `lib/product/product-authority-contract.ts` |
| reports/PRODUCT_AUTHORITY_CONTRACT_COMPLETION.md | 24 | - `ProductAuthorityState` type (9 states) |
| reports/PRODUCT_AUTHORITY_CONTRACT_COMPLETION.md | 25 | - `ProductAuthorityContract` interface |
