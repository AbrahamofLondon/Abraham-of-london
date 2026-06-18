/**
 * Structured access to reports/external-product-value-evidence.json.
 *
 * This report is the only estate-wide product-applicable evidence source that
 * currently carries benchmark descriptors, rendered output reviews, and
 * per-product comparison notes across all 43 catalog products.
 *
 * Consumers must still fail closed:
 * - a benchmark descriptor is not a pass
 * - a comparison note is not a clearance
 * - a missing rendered output review keeps authority blocked
 */

const ROOT = typeof process !== "undefined" && process.cwd ? process.cwd() : "";

function getFs() {
  try {
    return require("fs");
  } catch {
    return null;
  }
}

function getPath() {
  try {
    return require("path");
  } catch {
    return null;
  }
}

export interface ExternalProductDescriptor {
  productCode: string;
  productFamily: string;
  displayName: string;
  isPaid: boolean;
  priceLabel: string;
}

export interface ExternalProductBenchmarkAlternative {
  alternativeType: string;
  customerCostEstimate: string;
  expectedStrength: string;
  expectedWeakness: string;
}

export interface ExternalProductBenchmark {
  productCode: string;
  productFamily: string;
  customerExpectation: {
    expectedUseCase: string;
    expectedCustomerSophistication: string;
    expectedOutcome: string;
    minimumUsefulResult: string;
    seriousBuyerStandard: string;
  };
  marketAlternatives: ExternalProductBenchmarkAlternative[];
  mustOutperform: string[];
  proofRequired: string[];
}

export interface ExternalRenderedOutputReview {
  productCode: string;
  renderedOutputAvailable: boolean;
  testedOutputSource: string;
  liveRouteVerified: boolean;
  renderedOutputCaptured: boolean;
  samples: Array<{
    label: string;
    inputSummary: string;
    outputText: string;
    sectionsPresent: string[];
  }>;
  antiToy: {
    productCode: string;
    testedOutputSource: string;
    toyRiskScore: number;
    failsAntiToyTest: boolean;
    reasons: string[];
    requiredCorrections: string[];
  };
  redTeam: {
    productCode: string;
    testedOutputSource: string;
    scores: Record<string, number>;
    reviews: Array<{
      reviewerId: string;
      reviewerQuestion: string;
      scores: Record<string, number>;
      verdict: "accept" | "reject";
      reasons: string[];
    }>;
    criticalRejections: string[];
    survives: boolean;
  };
  usefulnessProof: {
    productCode: string;
    testedOutputSource: string;
    proofsEstablished: string[];
    proofsMissing: string[];
    hasProof: boolean;
    notes: string[];
  };
  timeValueSurplusPassed: boolean;
  judgementIsCaseDerived: boolean;
}

export interface ExternalMarketComparisonRow {
  productCode: string;
  alternative: string;
  whatWeDoBetter: string;
  whatTheAlternativeDoesBetter: string;
  whereWeAreWeaker: string;
  whatWouldMakeUsClearlySuperior: string;
  wouldCustomerReturnAfterOneUse: "yes" | "no" | "uncertain";
}

export interface ExternalLiveRouteCapture {
  productCode: string;
  route: string;
  scenarioId: string;
  inputPayload: Record<string, unknown>;
  renderedOutputText: string;
  renderedSections: string[];
  judgementFieldsDetected: Record<string, boolean>;
  usesJudgementEngine: boolean;
  captureMethod: string;
  capturedAt: string;
}

export interface ExternalProductValueEvidenceReport {
  generatedAt: string;
  productsReviewed: number;
  liveRouteDiscovery: Array<{
    productCode: string;
    requiredRoute: string;
    discoveredRoute: string;
    routeExists: boolean;
    routeNotes: string[];
  }>;
  liveRouteCaptures: ExternalLiveRouteCapture[];
  benchmarks: ExternalProductBenchmark[];
  renderedOutputReviews: ExternalRenderedOutputReview[];
  marketComparison: ExternalMarketComparisonRow[];
  descriptors: ExternalProductDescriptor[];
}

let cachedReport: ExternalProductValueEvidenceReport | null | undefined;

function readReport(): ExternalProductValueEvidenceReport | null {
  if (cachedReport !== undefined) return cachedReport;
  try {
    const fs = getFs();
    const path = getPath();
    if (!fs || !path) {
      cachedReport = null;
      return cachedReport;
    }
    const reportPath = path.join(ROOT, "reports", "external-product-value-evidence.json");
    if (!fs.existsSync(reportPath)) {
      cachedReport = null;
      return cachedReport;
    }
    cachedReport = JSON.parse(fs.readFileSync(reportPath, "utf8")) as ExternalProductValueEvidenceReport;
    return cachedReport;
  } catch {
    cachedReport = null;
    return cachedReport;
  }
}

export function loadExternalProductValueEvidence(): ExternalProductValueEvidenceReport | null {
  return readReport();
}

export function getExternalProductDescriptor(
  productCode: string,
): ExternalProductDescriptor | null {
  return readReport()?.descriptors.find((row) => row.productCode === productCode) ?? null;
}

export function getExternalProductBenchmark(
  productCode: string,
): ExternalProductBenchmark | null {
  return readReport()?.benchmarks.find((row) => row.productCode === productCode) ?? null;
}

export function getExternalRenderedOutputReview(
  productCode: string,
): ExternalRenderedOutputReview | null {
  return readReport()?.renderedOutputReviews.find((row) => row.productCode === productCode) ?? null;
}

export function getExternalMarketComparisonRows(
  productCode: string,
): ExternalMarketComparisonRow[] {
  return readReport()?.marketComparison.filter((row) => row.productCode === productCode) ?? [];
}

export function getExternalLiveRouteCapture(
  productCode: string,
): ExternalLiveRouteCapture | null {
  return readReport()?.liveRouteCaptures.find((row) => row.productCode === productCode) ?? null;
}

export function getExternalEvidenceGeneratedAt(): string | null {
  return readReport()?.generatedAt ?? null;
}
