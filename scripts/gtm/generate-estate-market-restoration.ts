import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  generateDecisionTrace,
  getAllProductEvidence,
  validateProductEvidenceRecord,
  type FinalDisposition,
} from "../../lib/fulfilment/estate-evidence-registry";
import { generateAllVerdicts, getVerdictCounts } from "../../lib/fulfilment/estate-verdict-layer";

const OUT_DIR = join(process.cwd(), "reports", "gtm");
const EVIDENCE_DIR = join(OUT_DIR, "estate-evidence-packages");
const REPORT_JSON = join(OUT_DIR, "estate-market-restoration-final.json");
const REPORT_MD = join(OUT_DIR, "estate-market-restoration-final.md");

const FINAL_STATES: FinalDisposition[] = [
  "RELEASE_READY_NOW",
  "CONTROLLED_RELEASE_READY",
  "PUBLIC_REFERENCE_READY",
  "INTERNAL_ONLY_JUSTIFIED",
  "MERGED_OR_RETIRED",
];

type SourceFingerprint = {
  path: string;
  exists: boolean;
  sha256: string | null;
};

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function fingerprintPath(path: string): SourceFingerprint {
  if (path.startsWith("/")) {
    return { path, exists: true, sha256: null };
  }

  const full = join(process.cwd(), path.replace(/\/$/, ""));
  if (!existsSync(full)) return { path, exists: false, sha256: null };
  if (statSync(full).isDirectory()) return { path, exists: true, sha256: null };
  return { path, exists: true, sha256: sha256(readFileSync(full, "utf8")) };
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export function generateEstateMarketRestorationReport() {
  mkdirSync(EVIDENCE_DIR, { recursive: true });

  const evidenceRecords = getAllProductEvidence();
  const verdicts = generateAllVerdicts();
  const verdictByCode = new Map(verdicts.map((v) => [v.productCode, v]));
  const counts = getVerdictCounts();

  const products = evidenceRecords.map((record) => {
    const validationErrors = validateProductEvidenceRecord(record);
    const trace = generateDecisionTrace(record.productCode);
    const verdict = verdictByCode.get(record.productCode);
    const sourcePaths = unique([
      ...record.evidencePaths,
      ...record.evidenceBasis.map((e) => e.path),
      ...record.testEvidence,
      ...record.routeEvidence,
    ]);
    const fingerprints = sourcePaths.map(fingerprintPath);
    const evidencePackage = {
      schemaVersion: "estate-market-restoration-evidence.v2",
      productCode: record.productCode,
      productName: record.productName,
      registryDisposition: record.finalDisposition,
      observedDisposition: verdict?.disposition ?? "UNRESOLVED",
      evidenceClass: record.evidenceClass,
      evidenceBasis: record.evidenceBasis,
      evidencePaths: record.evidencePaths,
      testEvidence: record.testEvidence,
      routeEvidence: record.routeEvidence,
      fulfilmentEvidence: record.fulfilmentEvidence,
      commercialEvidence: record.commercialEvidence,
      authorityBoundary: record.authorityBoundary,
      claimBoundary: record.claimBoundary,
      unresolvedExternalDependency: record.unresolvedExternalDependency,
      validationErrors,
      decisionTrace: trace,
      sourceFingerprints: fingerprints,
    };
    const packagePath = `reports/gtm/estate-evidence-packages/${record.productCode}.json`;
    writeFileSync(join(process.cwd(), packagePath), `${JSON.stringify(evidencePackage, null, 2)}\n`);

    return {
      code: record.productCode,
      name: record.productName,
      registryFinalState: record.finalDisposition,
      finalState: verdict?.disposition ?? "UNRESOLVED",
      evaluationPassed: verdict?.evaluationPassed ?? false,
      evaluationCount: verdict?.evaluationCount ?? 0,
      failedCount: verdict?.failedCount ?? 0,
      reason: verdict?.reason ?? "No verdict generated",
      evidenceClass: record.evidenceClass,
      evidencePackage: packagePath,
      evidencePackageHash: sha256(JSON.stringify(evidencePackage)),
      authorityBoundary: record.authorityBoundary,
      claimBoundary: record.claimBoundary,
      unresolvedExternalDependency: record.unresolvedExternalDependency,
      validationErrors,
    };
  });

  const unresolved = products.filter((p) => p.finalState === "UNRESOLVED" || p.validationErrors.length > 0);
  const report = {
    schemaVersion: "estate-market-restoration-final.v2",
    generatedAt: new Date().toISOString(),
    generator: "scripts/gtm/generate-estate-market-restoration.ts",
    canonicalSources: [
      "lib/fulfilment/estate-evidence-registry.ts",
      "lib/fulfilment/estate-observation-layer.ts",
      "lib/fulfilment/estate-evaluation-layer.ts",
      "lib/fulfilment/estate-verdict-layer.ts",
      "lib/product/product-fulfilment-contract.ts",
      "lib/commercial/catalog.ts",
    ],
    counts,
    totalProducts: products.length,
    releaseReadyNow: counts.RELEASE_READY_NOW,
    controlledReleaseReady: counts.CONTROLLED_RELEASE_READY,
    publicReferenceReady: counts.PUBLIC_REFERENCE_READY,
    internalOnlyJustified: counts.INTERNAL_ONLY_JUSTIFIED,
    mergedOrRetired: counts.MERGED_OR_RETIRED,
    unresolved: unresolved.length,
    products,
    reportAsEvidencePolicy: "Generated report is an output only. Evidence packages cite tracked source files, routes, tests and contracts; final reports are rejected as evidence inputs by validateProductEvidenceRecord.",
    gmiBoundary: {
      q2State: "controlled_pre_release",
      q2CheckoutAllowed: false,
      q2StripeProductId: null,
      q2StripePriceId: null,
      q1Superseded: false,
    },
    exactTruthStatement: unresolved.length === 0
      ? `ESTATE RESTORATION REPRODUCIBLE — ${products.length}/${products.length} PRODUCTS DISPOSITIONED FROM TRACKED SOURCE OBSERVATION`
      : `ESTATE RESTORATION NOT YET REPRODUCIBLE — ${unresolved.length} PRODUCT(S) HAVE VALIDATION OR VERDICT GAPS`,
  };

  writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);

  const rows = products.map((p) => `| ${p.code} | ${p.finalState} | ${p.failedCount}/${p.evaluationCount} | ${p.evidencePackage} | ${p.validationErrors.length} |`).join("\n");
  const countRows = FINAL_STATES.map((state) => `| ${state} | ${counts[state]} |`).join("\n");
  const md = `# Estate Market Restoration Final\n\nGenerated: ${report.generatedAt}\n\n## Counts\n\n| State | Count |\n|---|---:|\n${countRows}\n| UNRESOLVED | ${report.unresolved} |\n\n## Products\n\n| Product | Final state | Failed evaluations | Evidence package | Validation errors |\n|---|---|---:|---|---:|\n${rows}\n\n## Policy\n\n${report.reportAsEvidencePolicy}\n\n## Exact Truth Statement\n\n**${report.exactTruthStatement}**\n`;
  writeFileSync(REPORT_MD, md);

  return report;
}

const report = generateEstateMarketRestorationReport();
console.log(report.exactTruthStatement);
console.log(JSON.stringify({
  totalProducts: report.totalProducts,
  releaseReadyNow: report.releaseReadyNow,
  controlledReleaseReady: report.controlledReleaseReady,
  publicReferenceReady: report.publicReferenceReady,
  internalOnlyJustified: report.internalOnlyJustified,
  mergedOrRetired: report.mergedOrRetired,
  unresolved: report.unresolved,
}, null, 2));

process.exit(report.unresolved === 0 ? 0 : 1);

