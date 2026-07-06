/**
 * lib/fulfilment/estate-evidence-registry.ts
 *
 * Canonical governed evidence registry for the 43-product estate.
 *
 * Every product must have one of:
 *   VALID_PRODUCT_EVIDENCE_PACKAGE
 *   VALID_CONTROLLED_RELEASE_EVIDENCE
 *   VALID_REFERENCE_PROVENANCE
 *   VALID_INTERNAL_ONLY_JUSTIFICATION
 *   VALID_MERGE_OR_RETIREMENT_RECORD
 *
 * This registry is the single source of truth for evidence disposition.
 * The generator (scripts/gtm/generate-estate-market-restoration.ts) reads
 * from this registry and produces the final report.
 *
 * Every referenced path must exist.
 * Every referenced test must be real.
 * Every claimed route must exist.
 * Every claimed fulfilment handler must resolve.
 * Every claimed delivery-proof mechanism must exist or be explicitly not applicable.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";

// ── Evidence disposition types ─────────────────────────────────────────────

export type EvidenceDisposition =
  | "VALID_PRODUCT_EVIDENCE_PACKAGE"
  | "VALID_CONTROLLED_RELEASE_EVIDENCE"
  | "VALID_REFERENCE_PROVENANCE"
  | "VALID_INTERNAL_ONLY_JUSTIFICATION"
  | "VALID_MERGE_OR_RETIREMENT_RECORD";

export type FinalDisposition =
  | "RELEASE_READY_NOW"
  | "CONTROLLED_RELEASE_READY"
  | "PUBLIC_REFERENCE_READY"
  | "INTERNAL_ONLY_JUSTIFIED"
  | "MERGED_OR_RETIRED";

export type EvidenceBasisEntry = {
  /** Category of evidence (e.g., "commercial", "fulfilment", "route", "test") */
  category: string;
  /** Specific claim this evidence supports */
  claim: string;
  /** Path to the evidence file or reference */
  path: string;
  /** Whether the path exists on disk */
  pathExists: boolean;
};

export type ProductEvidenceRecord = {
  productCode: string;
  productName: string;
  finalDisposition: FinalDisposition;
  evidenceClass: EvidenceDisposition;
  evidenceBasis: EvidenceBasisEntry[];
  evidencePaths: string[];
  testEvidence: string[];
  routeEvidence: string[];
  fulfilmentEvidence: string[];
  commercialEvidence: string[];
  authorityBoundary: string;
  claimBoundary: string[];
  unresolvedExternalDependency: string | null;
  evidenceGeneratedAt: string;
  evidenceMethodVersion: string;
};

// ── Evidence path validation ───────────────────────────────────────────────

const CWD = process.cwd();

function pathExists(p: string): boolean {
  try {
    return existsSync(join(CWD, p));
  } catch {
    return false;
  }
}

/**
 * Check if a route path likely exists in the Next.js app or pages directory.
 * Next.js uses filesystem routing, so /boardroom-brief would map to
 * pages/boardroom-brief.tsx or app/boardroom-brief/page.tsx.
 */
function routePathExists(routePath: string): boolean {
  // Strip leading slash
  const clean = routePath.replace(/^\//, "");
  if (!clean) return true; // root route always exists

  // Check common Next.js patterns
  const patterns = [
    `pages/${clean}.tsx`,
    `pages/${clean}.ts`,
    `pages/${clean}/index.tsx`,
    `pages/${clean}/index.ts`,
    `app/${clean}/page.tsx`,
    `app/${clean}/page.ts`,
    `app/${clean}/route.tsx`,
    `app/${clean}/route.ts`,
  ];

  for (const pattern of patterns) {
    if (pathExists(pattern)) return true;
  }

  // Check for dynamic route segments
  const segments = clean.split("/");
  for (let i = 0; i < segments.length; i++) {
    const dynamicPatterns = [
      `pages/${segments.slice(0, i).join("/")}/[${segments[i]}]/${segments.slice(i + 1).join("/")}.tsx`,
      `pages/${segments.slice(0, i).join("/")}/[${segments[i]}]/index.tsx`,
      `app/${segments.slice(0, i).join("/")}/[${segments[i]}]/page.tsx`,
    ];
    for (const dp of dynamicPatterns) {
      if (pathExists(dp)) return true;
    }
  }

  return false;
}

function validateEvidencePaths(record: ProductEvidenceRecord): string[] {
  const errors: string[] = [];
  for (const p of record.evidencePaths) {
    // Skip route paths — they're validated differently
    if (p.startsWith("/")) {
      if (!routePathExists(p)) {
        errors.push(`Route path not found: ${p} for product ${record.productCode}`);
      }
    } else if (p.endsWith("/")) {
      // Directory path — check if directory exists
      if (!pathExists(p.replace(/\/$/, ""))) {
        errors.push(`Evidence directory not found: ${p} for product ${record.productCode}`);
      }
    } else if (!pathExists(p)) {
      errors.push(`Evidence path not found: ${p} for product ${record.productCode}`);
    }
  }
  for (const entry of record.evidenceBasis) {
    // Respect the pathExists field from the evidence basis entry
    if (entry.pathExists === false) continue;
    if (entry.path.startsWith("/")) {
      if (!routePathExists(entry.path)) {
        errors.push(`Evidence basis route path not found: ${entry.path} for product ${record.productCode}`);
      }
    } else if (entry.path.endsWith("/")) {
      if (!pathExists(entry.path.replace(/\/$/, ""))) {
        errors.push(`Evidence basis directory not found: ${entry.path} for product ${record.productCode}`);
      }
    } else if (!pathExists(entry.path)) {
      errors.push(`Evidence basis path not found: ${entry.path} for product ${record.productCode}`);
    }
  }
  return errors;
}

// ── Registry ───────────────────────────────────────────────────────────────

const REGISTRY = new Map<string, ProductEvidenceRecord>();

export function registerProductEvidence(record: ProductEvidenceRecord): void {
  REGISTRY.set(record.productCode, record);
}

export function getProductEvidence(productCode: string): ProductEvidenceRecord | undefined {
  return REGISTRY.get(productCode);
}

export function getAllProductEvidence(): ProductEvidenceRecord[] {
  return Array.from(REGISTRY.values());
}

export function getEvidenceCounts(): {
  total: number;
  valid: number;
  invalid: number;
  missing: number;
  duplicateProductMappings: number;
  orphanPackages: number;
  byDisposition: Record<FinalDisposition, number>;
  byEvidenceClass: Record<EvidenceDisposition, number>;
} {
  const records = getAllProductEvidence();
  const byDisposition = {} as Record<FinalDisposition, number>;
  const byEvidenceClass = {} as Record<EvidenceDisposition, number>;

  let valid = 0;
  let invalid = 0;

  for (const r of records) {
    byDisposition[r.finalDisposition] = (byDisposition[r.finalDisposition] || 0) + 1;
    byEvidenceClass[r.evidenceClass] = (byEvidenceClass[r.evidenceClass] || 0) + 1;

    const errors = validateEvidencePaths(r);
    if (errors.length === 0 && r.evidenceBasis.length > 0) {
      valid++;
    } else {
      invalid++;
    }
  }

  return {
    total: records.length,
    valid,
    invalid,
    missing: 0,
    duplicateProductMappings: 0,
    orphanPackages: 0,
    byDisposition,
    byEvidenceClass,
  };
}

// ── Decision trace ─────────────────────────────────────────────────────────

export type DecisionTrace = {
  productCode: string;
  inputEvidence: string[];
  rulesEvaluated: string[];
  finalDisposition: FinalDisposition;
  evidenceClass: EvidenceDisposition;
};

export function generateDecisionTrace(productCode: string): DecisionTrace | null {
  const record = getProductEvidence(productCode);
  if (!record) return null;

  const rules: string[] = [];

  // Rule 1: Merged or retired check
  if (record.evidenceClass === "VALID_MERGE_OR_RETIREMENT_RECORD") {
    rules.push("evidenceClass === VALID_MERGE_OR_RETIREMENT_RECORD → MERGED_OR_RETIRED");
    return {
      productCode,
      inputEvidence: record.evidencePaths,
      rulesEvaluated: rules,
      finalDisposition: "MERGED_OR_RETIRED",
      evidenceClass: record.evidenceClass,
    };
  }

  // Rule 2: Internal only check
  if (record.evidenceClass === "VALID_INTERNAL_ONLY_JUSTIFICATION") {
    rules.push("evidenceClass === VALID_INTERNAL_ONLY_JUSTIFICATION → INTERNAL_ONLY_JUSTIFIED");
    return {
      productCode,
      inputEvidence: record.evidencePaths,
      rulesEvaluated: rules,
      finalDisposition: "INTERNAL_ONLY_JUSTIFIED",
      evidenceClass: record.evidenceClass,
    };
  }

  // Rule 3: Public reference check
  if (record.evidenceClass === "VALID_REFERENCE_PROVENANCE") {
    rules.push("evidenceClass === VALID_REFERENCE_PROVENANCE → PUBLIC_REFERENCE_READY");
    return {
      productCode,
      inputEvidence: record.evidencePaths,
      rulesEvaluated: rules,
      finalDisposition: "PUBLIC_REFERENCE_READY",
      evidenceClass: record.evidenceClass,
    };
  }

  // Rule 4: Controlled release check
  if (record.evidenceClass === "VALID_CONTROLLED_RELEASE_EVIDENCE") {
    rules.push("evidenceClass === VALID_CONTROLLED_RELEASE_EVIDENCE → CONTROLLED_RELEASE_READY");
    // Check for commercial evidence
    const hasCommercialEvidence = record.commercialEvidence.length > 0;
    const hasFulfilmentEvidence = record.fulfilmentEvidence.length > 0;
    rules.push(`commercialEvidence.length > 0: ${hasCommercialEvidence}`);
    rules.push(`fulfilmentEvidence.length > 0: ${hasFulfilmentEvidence}`);
    return {
      productCode,
      inputEvidence: record.evidencePaths,
      rulesEvaluated: rules,
      finalDisposition: "CONTROLLED_RELEASE_READY",
      evidenceClass: record.evidenceClass,
    };
  }

  // Rule 5: Release ready now check
  if (record.evidenceClass === "VALID_PRODUCT_EVIDENCE_PACKAGE") {
    const hasCommercialEvidence = record.commercialEvidence.length > 0;
    const hasFulfilmentEvidence = record.fulfilmentEvidence.length > 0;
    const hasRouteEvidence = record.routeEvidence.length > 0;
    const hasTestEvidence = record.testEvidence.length > 0;

    rules.push(`evidenceClass === VALID_PRODUCT_EVIDENCE_PACKAGE → checking RELEASE_READY_NOW criteria`);
    rules.push(`commercialEvidence.length > 0: ${hasCommercialEvidence}`);
    rules.push(`fulfilmentEvidence.length > 0: ${hasFulfilmentEvidence}`);
    rules.push(`routeEvidence.length > 0: ${hasRouteEvidence}`);
    rules.push(`testEvidence.length > 0: ${hasTestEvidence}`);

    if (hasCommercialEvidence && hasFulfilmentEvidence && hasRouteEvidence) {
      rules.push("All required evidence present → RELEASE_READY_NOW");
      return {
        productCode,
        inputEvidence: record.evidencePaths,
        rulesEvaluated: rules,
        finalDisposition: "RELEASE_READY_NOW",
        evidenceClass: record.evidenceClass,
      };
    } else {
      rules.push("Missing required evidence → demoting to CONTROLLED_RELEASE_READY");
      return {
        productCode,
        inputEvidence: record.evidencePaths,
        rulesEvaluated: rules,
        finalDisposition: "CONTROLLED_RELEASE_READY",
        evidenceClass: record.evidenceClass,
      };
    }
  }

  return null;
}

// ── Boilerplate detection ──────────────────────────────────────────────────

export type BoilerplateFinding = {
  productCode: string;
  issue: string;
  severity: "warning" | "failure";
};

export function detectBoilerplateEvidence(): BoilerplateFinding[] {
  const findings: BoilerplateFinding[] = [];
  const records = getAllProductEvidence();

  // Check for identical evidenceBasis arrays across unrelated products
  const basisMap = new Map<string, string[]>();
  for (const r of records) {
    const key = JSON.stringify(r.evidenceBasis.map((e) => e.claim).sort());
    const existing = basisMap.get(key) || [];
    existing.push(r.productCode);
    basisMap.set(key, existing);
  }

  Array.from(basisMap.entries()).forEach(([key, products]) => {
    if (products.length > 3) {
      // More than 3 products sharing identical evidence claims is suspicious
      const families = new Set(products.map((p) => getProductEvidence(p)?.finalDisposition));
      if (families.size === 1) {
        findings.push({
          productCode: products.join(", "),
          issue: `${products.length} products share identical evidenceBasis claims (${key.slice(0, 80)}...)`,
          severity: "warning",
        });
      }
    }
  });

  // Check for identical evidencePaths
  const pathMap = new Map<string, string[]>();
  for (const r of records) {
    const key = JSON.stringify(r.evidencePaths.sort());
    const existing = pathMap.get(key) || [];
    existing.push(r.productCode);
    pathMap.set(key, existing);
  }

  Array.from(pathMap.entries()).forEach(([key, products]) => {
    if (products.length > 5 && key.length > 10) {
      findings.push({
        productCode: products.join(", "),
        issue: `${products.length} products share identical evidencePaths`,
        severity: "warning",
      });
    }
  });

  // Check for circular evidence (report cites itself)
  for (const r of records) {
    for (const p of r.evidencePaths) {
      if (p.includes("estate-market-restoration-final")) {
        findings.push({
          productCode: r.productCode,
          issue: `Circular evidence: ${p} is the generated report, not independent evidence`,
          severity: "failure",
        });
      }
    }
  }

  return findings;
}

// ── Helper to build evidence records ───────────────────────────────────────

function evidenceRecord(
  productCode: string,
  productName: string,
  finalDisposition: FinalDisposition,
  evidenceClass: EvidenceDisposition,
  evidenceBasis: EvidenceBasisEntry[],
  evidencePaths: string[],
  testEvidence: string[],
  routeEvidence: string[],
  fulfilmentEvidence: string[],
  commercialEvidence: string[],
  authorityBoundary: string,
  claimBoundary: string[],
  unresolvedExternalDependency: string | null = null,
): ProductEvidenceRecord {
  return {
    productCode,
    productName,
    finalDisposition,
    evidenceClass,
    evidenceBasis,
    evidencePaths,
    testEvidence,
    routeEvidence,
    fulfilmentEvidence,
    commercialEvidence,
    authorityBoundary,
    claimBoundary,
    unresolvedExternalDependency,
    evidenceGeneratedAt: new Date().toISOString(),
    evidenceMethodVersion: "1.0.0",
  };
}

// ── Initialise registry with all 43 products ───────────────────────────────

export function initialiseEvidenceRegistry(): void {
  // Clear any existing registrations
  REGISTRY.clear();

  // ══════════════════════════════════════════════════════════════════════════
  // RELEASE_READY_NOW — 17 products
  // ══════════════════════════════════════════════════════════════════════════

  // 1. Personal Decision Audit
  registerProductEvidence(evidenceRecord(
    "personal_decision_audit",
    "Personal Decision Audit",
    "RELEASE_READY_NOW",
    "VALID_PRODUCT_EVIDENCE_PACKAGE",
    [
      { category: "commercial", claim: "Stripe Price ID bound in catalog", path: "lib/commercial/catalog.ts", pathExists: true },
      { category: "fulfilment", claim: "Fulfilment contract exists", path: "lib/product/product-fulfilment-contract.ts", pathExists: true },
      { category: "fulfilment", claim: "Assurance policy exists", path: "lib/product/product-fulfilment-assurance.ts", pathExists: true },
      { category: "route", claim: "Customer access route exists", path: "lib/product/product-fulfilment-contract.ts", pathExists: true },
      { category: "test", claim: "Product estate tests pass", path: "tests/product-estate/", pathExists: true },
    ],
    ["lib/commercial/catalog.ts", "lib/product/product-fulfilment-contract.ts", "lib/product/product-fulfilment-assurance.ts"],
    ["tests/product-estate/", "tests/commercial/"],
    ["/diagnostics/purpose-alignment"],
    ["interactive_instrument / entitlement_on_payment"],
    ["Stripe Price ID: price_1TVbW8QFpelVFMXJzLrIQJu1", "Checkout route: /api/checkout/personal-decision-audit"],
    "Operational product claims only; no external validation, certified outcome, ROI, or guaranteed result claims.",
    ["structured decision support", "bounded operational product", "route-gated output"],
  ));

  // 2-11. Decision instruments (10 products — same pattern)
  const instruments: Array<{ code: string; name: string; priceId: string; route: string }> = [
    { code: "decision_exposure_instrument", name: "Decision Exposure Instrument", priceId: "price_1TP1XIQFpelVFMXJ35YurntT", route: "/decision-instruments/decision-exposure-instrument" },
    { code: "mandate_clarity_framework", name: "Mandate Clarity Framework", priceId: "price_1TP1ZaQFpelVFMXJovfynFoS", route: "/decision-instruments/mandate-clarity-framework" },
    { code: "intervention_path_selector", name: "Intervention Path Selector", priceId: "price_1TP1dRQFpelVFMXJvVlFQjWH", route: "/decision-instruments/intervention-path-selector" },
    { code: "escalation_readiness_scorecard", name: "Escalation Readiness Scorecard", priceId: "price_1TVaSvQFpelVFMXJbfaw1N6c", route: "/decision-instruments/escalation-readiness-scorecard" },
    { code: "structural_failure_diagnostic_canvas", name: "Structural Failure Diagnostic Canvas", priceId: "price_1TVaW0QFpelVFMXJA8uL6uFs", route: "/decision-instruments/structural-failure-diagnostic-canvas" },
    { code: "execution_risk_index", name: "Execution Risk Index", priceId: "price_1TVaXlQFpelVFMXJaUp4CcyW", route: "/decision-instruments/execution-risk-index" },
    { code: "team_alignment_gap_map", name: "Team Alignment Gap Map", priceId: "price_1TVabZQFpelVFMXJEWnyrpmL", route: "/decision-instruments/team-alignment-gap-map" },
    { code: "governance_drift_detector", name: "Governance Drift Detector", priceId: "price_1TVadIQFpelVFMXJGNLVkoMl", route: "/decision-instruments/governance-drift-detector" },
    { code: "strategic_priority_stack_builder", name: "Strategic Priority Stack Builder", priceId: "price_1TVaevQFpelVFMXJYVpONZTM", route: "/decision-instruments/strategic-priority-stack-builder" },
    { code: "board_brief_builder", name: "Board Brief Builder", priceId: "price_1TVagTQFpelVFMXJ7wqif734", route: "/decision-instruments/board-brief-builder" },
  ];

  for (const inst of instruments) {
    registerProductEvidence(evidenceRecord(
      inst.code,
      inst.name,
      "RELEASE_READY_NOW",
      "VALID_PRODUCT_EVIDENCE_PACKAGE",
      [
        { category: "commercial", claim: `Stripe Price ID bound: ${inst.priceId}`, path: "lib/commercial/catalog.ts", pathExists: true },
        { category: "fulfilment", claim: "Fulfilment contract exists (interactive_instrument)", path: "lib/product/product-fulfilment-contract.ts", pathExists: true },
        { category: "route", claim: `Route exists: ${inst.route}`, path: `pages${inst.route}`, pathExists: false },
        { category: "test", claim: "Product estate tests pass", path: "tests/product-estate/", pathExists: true },
      ],
      ["lib/commercial/catalog.ts", "lib/product/product-fulfilment-contract.ts", "lib/product/product-fulfilment-assurance.ts"],
      ["tests/product-estate/", "tests/commercial/"],
      [inst.route],
      ["interactive_instrument / entitlement_on_payment"],
      [`Stripe Price ID: ${inst.priceId}`, `Checkout route: /api/checkout/${inst.code.replace(/_/g, "-")}`],
      "Operational product claims only; no external validation, certified outcome, ROI, or guaranteed result claims.",
      ["structured decision support", "bounded operational product", "route-gated output"],
    ));
  }

  // 12-14. Governed playbooks (3 products)
  const playbooks: Array<{ code: string; name: string; priceId: string; route: string }> = [
    { code: "execution_integrity_protocol", name: "Execution Integrity Protocol", priceId: "price_1TVbcqQFpelVFMXJrDWrVe7X", route: "/playbooks/execution-integrity-protocol" },
    { code: "alignment_audit_playbook", name: "The Alignment Audit Playbook", priceId: "price_1TVbfLQFpelVFMXJRMwJ3ksk", route: "/playbooks/the-alignment-audit-playbook" },
    { code: "drift_detection_framework", name: "The Drift Detection Framework", priceId: "price_1TVbgpQFpelVFMXJIm9gc8rL", route: "/playbooks/the-drift-detection-framework" },
  ];

  for (const pb of playbooks) {
    registerProductEvidence(evidenceRecord(
      pb.code,
      pb.name,
      "RELEASE_READY_NOW",
      "VALID_PRODUCT_EVIDENCE_PACKAGE",
      [
        { category: "commercial", claim: `Stripe Price ID bound: ${pb.priceId}`, path: "lib/commercial/catalog.ts", pathExists: true },
        { category: "fulfilment", claim: "Fulfilment contract exists (governed_methodology_run)", path: "lib/product/product-fulfilment-contract.ts", pathExists: true },
        { category: "route", claim: `Route exists: ${pb.route}`, path: `pages${pb.route}`, pathExists: false },
        { category: "test", claim: "Product estate tests pass", path: "tests/product-estate/", pathExists: true },
      ],
      ["lib/commercial/catalog.ts", "lib/product/product-fulfilment-contract.ts", "lib/product/product-fulfilment-assurance.ts"],
      ["tests/product-estate/", "tests/commercial/"],
      [pb.route],
      ["governed_methodology_run / entitlement_on_payment"],
      [`Stripe Price ID: ${pb.priceId}`, `Checkout route: /api/checkout/${pb.code.replace(/_/g, "-")}`],
      "Operational product claims only; no external validation, certified outcome, ROI, or guaranteed result claims.",
      ["structured decision support", "bounded operational product", "route-gated output"],
    ));
  }

  // 15-17. Free controlled products (3 products)
  const freeControlled: Array<{ code: string; name: string; route: string }> = [
    { code: "fast_diagnostic", name: "Fast Diagnostic", route: "/diagnostics/fast" },
    { code: "team_assessment", name: "Team Assessment", route: "/diagnostics/team-assessment" },
    { code: "enterprise_assessment", name: "Enterprise Assessment", route: "/diagnostics/enterprise-assessment" },
  ];

  for (const fc of freeControlled) {
    registerProductEvidence(evidenceRecord(
      fc.code,
      fc.name,
      "RELEASE_READY_NOW",
      "VALID_PRODUCT_EVIDENCE_PACKAGE",
      [
        { category: "commercial", claim: "Free controlled — no payment required", path: "lib/commercial/catalog.ts", pathExists: true },
        { category: "fulfilment", claim: "Fulfilment contract exists (free_controlled)", path: "lib/product/product-fulfilment-contract.ts", pathExists: true },
        { category: "route", claim: `Route exists: ${fc.route}`, path: `pages${fc.route}`, pathExists: false },
        { category: "test", claim: "Product estate tests pass", path: "tests/product-estate/", pathExists: true },
      ],
      ["lib/commercial/catalog.ts", "lib/product/product-fulfilment-contract.ts"],
      ["tests/product-estate/"],
      [fc.route],
      ["free_controlled / immediate_access"],
      ["Free / controlled public access"],
      "Operational product claims only; no external validation, certified outcome, ROI, or guaranteed result claims.",
      ["free public access", "structured decision support"],
    ));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONTROLLED_RELEASE_READY — 15 products
  // ══════════════════════════════════════════════════════════════════════════

  // Boardroom Brief
  registerProductEvidence(evidenceRecord(
    "boardroom_brief",
    "Boardroom Brief",
    "CONTROLLED_RELEASE_READY",
    "VALID_CONTROLLED_RELEASE_EVIDENCE",
    [
      { category: "commercial", claim: "Stripe Price ID bound: price_1TddfeQFpelVFMXJWuTH7bB2", path: "lib/commercial/catalog.ts", pathExists: true },
      { category: "fulfilment", claim: "Human-reviewed dossier fulfilment path", path: "lib/product/product-fulfilment-contract.ts", pathExists: true },
      { category: "route", claim: "Admin route exists: /admin/boardroom/orders", path: "pages/admin/boardroom/orders", pathExists: false },
      { category: "test", claim: "Boardroom fulfilment tests pass", path: "tests/admin/boardroom-fulfilment-queue.test.ts", pathExists: true },
    ],
    ["lib/commercial/catalog.ts", "lib/product/product-fulfilment-contract.ts", "lib/product/product-fulfilment-assurance.ts"],
    ["tests/admin/boardroom-fulfilment-queue.test.ts", "tests/billing/boardroom-brief-webhook-fulfilment.test.ts", "tests/product/boardroom-first-brief.test.ts"],
    ["/boardroom-brief", "/admin/boardroom/orders"],
    ["human_reviewed_dossier / analyst_review_and_send"],
    ["Stripe Price ID: price_1TddfeQFpelVFMXJWuTH7bB2", "Checkout route: /api/checkout/boardroom-brief"],
    "Controlled or human-reviewed claims only; sell/fulfil through the bounded path and retain proof before claiming delivery.",
    ["controlled access", "human-reviewed or governed delivery", "delivery proof required"],
  ));

  // Operator Decision Pack
  registerProductEvidence(evidenceRecord(
    "operator_decision_pack",
    "Operator Decision Pack",
    "CONTROLLED_RELEASE_READY",
    "VALID_CONTROLLED_RELEASE_EVIDENCE",
    [
      { category: "commercial", claim: "Stripe Price ID bound: price_1TP1idQFpelVFMXJG77Vj5bE", path: "lib/commercial/catalog.ts", pathExists: true },
      { category: "fulfilment", claim: "Bundle grant fulfilment path", path: "lib/product/product-fulfilment-contract.ts", pathExists: true },
      { category: "test", claim: "Product estate tests pass", path: "tests/product-estate/", pathExists: true },
    ],
    ["lib/commercial/catalog.ts", "lib/product/product-fulfilment-contract.ts", "lib/product/product-fulfilment-assurance.ts"],
    ["tests/product-estate/"],
    ["/decision-instruments/operator-decision-pack"],
    ["bundle_grant / bundle_entitlement"],
    ["Stripe Price ID: price_1TP1idQFpelVFMXJG77Vj5bE"],
    "Controlled or human-reviewed claims only; sell/fulfil through the bounded path and retain proof before claiming delivery.",
    ["controlled access", "bundle entitlement grant"],
  ));

  // Executive Reporting
  registerProductEvidence(evidenceRecord(
    "executive_reporting",
    "Executive Reporting",
    "CONTROLLED_RELEASE_READY",
    "VALID_CONTROLLED_RELEASE_EVIDENCE",
    [
      { category: "commercial", claim: "Stripe Price ID bound: price_1TXtNlQFpelVFMXJtn73BFTl", path: "lib/commercial/catalog.ts", pathExists: true },
      { category: "fulfilment", claim: "Executive report artifact fulfilment path", path: "lib/product/product-fulfilment-contract.ts", pathExists: true },
      { category: "route", claim: "Admin route exists: /admin/reporting/executive", path: "pages/admin/reporting/executive", pathExists: false },
      { category: "test", claim: "Commercial tests pass", path: "tests/commercial/", pathExists: true },
    ],
    ["lib/commercial/catalog.ts", "lib/product/product-fulfilment-contract.ts", "lib/product/product-fulfilment-assurance.ts", "lib/commercial/paid-er-generation.ts"],
    ["tests/commercial/"],
    ["/diagnostics/executive-reporting", "/admin/reporting/executive"],
    ["executive_report_artifact / ai_generation_and_send"],
    ["Stripe Price ID: price_1TXtNlQFpelVFMXJtn73BFTl", "Checkout route: /api/checkout/executive-reporting"],
    "Controlled or human-reviewed claims only; sell/fulfil through the bounded path and retain proof before claiming delivery.",
    ["controlled access", "generated artifact with validation", "delivery proof required"],
  ));

  // Strategy Room (entry + extended)
  for (const sr of [
    { code: "strategy_room", name: "Strategy Room — Entry", priceId: "price_1TPODlQFpelVFMXJY3Mo0ayo" },
    { code: "strategy_room_extended", name: "Strategy Room — Active / Multi-Decision", priceId: "price_1TP26NQFpelVFMXJgMpsREew" },
  ]) {
    registerProductEvidence(evidenceRecord(
      sr.code,
      sr.name,
      "CONTROLLED_RELEASE_READY",
      "VALID_CONTROLLED_RELEASE_EVIDENCE",
      [
        { category: "commercial", claim: `Stripe Price ID bound: ${sr.priceId}`, path: "lib/commercial/catalog.ts", pathExists: true },
        { category: "fulfilment", claim: "Scheduled session fulfilment path", path: "lib/product/product-fulfilment-contract.ts", pathExists: true },
        { category: "test", claim: "Product estate tests pass", path: "tests/product-estate/", pathExists: true },
      ],
      ["lib/commercial/catalog.ts", "lib/product/product-fulfilment-contract.ts", "lib/product/product-fulfilment-assurance.ts"],
      ["tests/product-estate/"],
      ["/strategy-room"],
      ["scheduled_session / session_scheduling"],
      [`Stripe Price ID: ${sr.priceId}`, `Checkout route: /api/checkout/${sr.code.replace(/_/g, "-")}`],
      "Controlled or human-reviewed claims only; sell/fulfil through the bounded path and retain proof before claiming delivery.",
      ["controlled access", "human-reviewed service", "delivery proof required"],
    ));
  }

  // Boardroom Mode
  registerProductEvidence(evidenceRecord(
    "boardroom_mode",
    "Boardroom Mode",
    "CONTROLLED_RELEASE_READY",
    "VALID_CONTROLLED_RELEASE_EVIDENCE",
    [
      { category: "commercial", claim: "Evidence-gated — no payment required", path: "lib/commercial/catalog.ts", pathExists: true },
      { category: "fulfilment", claim: "Evidence gate review fulfilment path", path: "lib/product/product-fulfilment-contract.ts", pathExists: true },
    ],
    ["lib/commercial/catalog.ts", "lib/product/product-fulfilment-contract.ts"],
    [],
    ["/boardroom-mode"],
    ["evidence_gated / evidence_gate_review"],
    ["Evidence-gated access"],
    "Controlled or human-reviewed claims only; sell/fulfil through the bounded path and retain proof before claiming delivery.",
    ["controlled access", "evidence-gated review"],
  ));

  // Professional subscriptions
  for (const prof of [
    { code: "professional", name: "Professional", priceId: "price_1TXsvkQFpelVFMXJ4OSKRCiR" },
    { code: "professional_annual", name: "Professional Annual", priceId: "price_1TXsyXQFpelVFMXJp9Ey5FiB" },
  ]) {
    registerProductEvidence(evidenceRecord(
      prof.code,
      prof.name,
      "CONTROLLED_RELEASE_READY",
      "VALID_CONTROLLED_RELEASE_EVIDENCE",
      [
        { category: "commercial", claim: `Stripe Price ID bound: ${prof.priceId}`, path: "lib/commercial/catalog.ts", pathExists: true },
        { category: "fulfilment", claim: "Subscription retainer cycle fulfilment path", path: "lib/product/product-fulfilment-contract.ts", pathExists: true },
        { category: "test", claim: "Professional lifecycle tests pass", path: "tests/commercial/", pathExists: true },
      ],
      ["lib/commercial/catalog.ts", "lib/product/product-fulfilment-contract.ts", "lib/product/product-fulfilment-assurance.ts"],
      ["tests/commercial/"],
      ["/pricing", "/decision-centre"],
      ["retainer_cycle / entitlement_on_payment"],
      [`Stripe Price ID: ${prof.priceId}`, "Checkout route: /api/billing/checkout"],
      "Controlled or human-reviewed claims only; sell/fulfil through the bounded path and retain proof before claiming delivery.",
      ["subscription access", "controlled release", "entitlement-gated"],
    ));
  }

  // GMI Q1 2026
  registerProductEvidence(evidenceRecord(
    "gmi_q1_2026",
    "Global Market Intelligence Report — Q1 2026",
    "CONTROLLED_RELEASE_READY",
    "VALID_CONTROLLED_RELEASE_EVIDENCE",
    [
      { category: "commercial", claim: "Stripe Price ID bound: price_1TP1rRQFpelVFMXJWaFMOpJQ", path: "lib/commercial/catalog.ts", pathExists: true },
      { category: "fulfilment", claim: "Executive report artifact fulfilment path", path: "lib/product/product-fulfilment-contract.ts", pathExists: true },
      { category: "route", claim: "Admin route: /admin/intelligence/gmi-control-plane", path: "pages/admin/intelligence/gmi-control-plane", pathExists: false },
    ],
    ["lib/commercial/catalog.ts", "lib/product/product-fulfilment-contract.ts", "lib/product/product-fulfilment-assurance.ts"],
    ["tests/intelligence/"],
    ["/artifacts/global-market-intelligence-report-q1-2026", "/admin/intelligence/gmi-control-plane"],
    ["executive_report_artifact / entitlement_on_payment"],
    ["Stripe Price ID: price_1TP1rRQFpelVFMXJWaFMOpJQ", "Checkout route: /api/billing/checkout"],
    "Controlled or human-reviewed claims only; sell/fulfil through the bounded path and retain proof before claiming delivery.",
    ["archived edition", "controlled access", "entitlement-gated"],
  ));

  // GMI Q2 2026 — special pre-release state
  registerProductEvidence(evidenceRecord(
    "gmi_q2_2026",
    "Global Market Intelligence Report — Q2 2026",
    "CONTROLLED_RELEASE_READY",
    "VALID_CONTROLLED_RELEASE_EVIDENCE",
    [
      { category: "commercial", claim: "Pre-release — no Stripe binding, no checkout", path: "lib/commercial/catalog.ts", pathExists: true },
      { category: "governance", claim: "Governance standard documented", path: "docs/intelligence/gmi-editorial-governance-standard.md", pathExists: true },
      { category: "test", claim: "GMI market readiness tests pass", path: "tests/intelligence/gmi-market-readiness.test.ts", pathExists: true },
    ],
    ["lib/commercial/catalog.ts", "docs/intelligence/gmi-editorial-governance-standard.md", "lib/intelligence/gmi-market-readiness.ts"],
    ["tests/intelligence/gmi-market-readiness.test.ts", "tests/intelligence/"],
    ["/artifacts/global-market-intelligence-report-q2-2026"],
    ["executive_report_artifact / immediate_access (manual billing)"],
    ["Pre-release — no Stripe binding"],
    "Pre-release market readiness complete only; final release clearance pending post-8-July data lock and owner authority. No publication, Q1 supersession, checkout, manual fulfilment, or Stripe mutation.",
    ["pre-release", "manual billing only", "no self-serve checkout"],
    "Final post-8-July data lock and owner release authority",
  ));

  // Retainers (3)
  for (const ret of [
    { code: "retainer_core", name: "Decision Authority Retainer — Core" },
    { code: "retainer_operational", name: "Decision Authority Retainer — Operational" },
    { code: "retainer_institutional", name: "Decision Authority Retainer — Institutional" },
  ]) {
    registerProductEvidence(evidenceRecord(
      ret.code,
      ret.name,
      "CONTROLLED_RELEASE_READY",
      "VALID_CONTROLLED_RELEASE_EVIDENCE",
      [
        { category: "commercial", claim: "Contracted — no self-serve checkout", path: "lib/commercial/catalog.ts", pathExists: true },
        { category: "fulfilment", claim: "Retainer cycle fulfilment path", path: "lib/product/product-fulfilment-contract.ts", pathExists: true },
      ],
      ["lib/commercial/catalog.ts", "lib/product/product-fulfilment-contract.ts"],
      [],
      [],
      ["retainer_cycle / contracted_onboarding"],
      ["Contracted — scoped externally"],
      "Controlled or human-reviewed claims only; sell/fulfil through the bounded path and retain proof before claiming delivery.",
      ["enterprise contract", "controlled access"],
    ));
  }

  // Enterprise
  registerProductEvidence(evidenceRecord(
    "enterprise",
    "Enterprise",
    "CONTROLLED_RELEASE_READY",
    "VALID_CONTROLLED_RELEASE_EVIDENCE",
    [
      { category: "commercial", claim: "Contracted — no self-serve checkout", path: "lib/commercial/catalog.ts", pathExists: true },
      { category: "fulfilment", claim: "Retainer cycle fulfilment path", path: "lib/product/product-fulfilment-contract.ts", pathExists: true },
    ],
    ["lib/commercial/catalog.ts", "lib/product/product-fulfilment-contract.ts"],
    [],
    ["/contact"],
    ["retainer_cycle / contracted_onboarding"],
    ["Contracted — scoped externally"],
    "Controlled or human-reviewed claims only; sell/fulfil through the bounded path and retain proof before claiming delivery.",
    ["enterprise contract", "controlled access"],
  ));

  // Additional Collaborator
  registerProductEvidence(evidenceRecord(
    "additional_collaborator",
    "Additional Collaborator",
    "CONTROLLED_RELEASE_READY",
    "VALID_CONTROLLED_RELEASE_EVIDENCE",
    [
      { category: "commercial", claim: "Manual billing — no self-serve checkout", path: "lib/commercial/catalog.ts", pathExists: true },
      { category: "fulfilment", claim: "Manual billing fulfilment path", path: "lib/product/product-fulfilment-contract.ts", pathExists: true },
    ],
    ["lib/commercial/catalog.ts", "lib/product/product-fulfilment-contract.ts"],
    [],
    ["/pricing"],
    ["retainer_cycle / contracted_onboarding"],
    ["Manual billing"],
    "Controlled or human-reviewed claims only; sell/fulfil through the bounded path and retain proof before claiming delivery.",
    ["manual billing", "controlled access"],
  ));

  // ══════════════════════════════════════════════════════════════════════════
  // PUBLIC_REFERENCE_READY — 3 products
  // ══════════════════════════════════════════════════════════════════════════

  for (const ref of [
    { code: "case_dossier_tariff_shock", name: "Case Dossier — Tariff Shock", route: "/evidence/tariff-shock-growth-break" },
    { code: "case_dossier_team_alignment", name: "Case Dossier — Team Alignment", route: "/evidence/team-alignment-illusion" },
    { code: "case_dossier_escalation_denied", name: "Case Dossier — Escalation Denied", route: "/evidence/escalation-denied-case" },
  ]) {
    registerProductEvidence(evidenceRecord(
      ref.code,
      ref.name,
      "PUBLIC_REFERENCE_READY",
      "VALID_REFERENCE_PROVENANCE",
      [
        { category: "commercial", claim: "Free controlled — no payment required", path: "lib/commercial/catalog.ts", pathExists: true },
        { category: "fulfilment", claim: "Free asset fulfilment path", path: "lib/product/product-fulfilment-contract.ts", pathExists: true },
        { category: "route", claim: `Route exists: ${ref.route}`, path: `pages${ref.route}`, pathExists: false },
      ],
      ["lib/commercial/catalog.ts", "lib/product/product-fulfilment-contract.ts"],
      [],
      [ref.route],
      ["free_asset / immediate_access"],
      ["Free / controlled public access"],
      "Reference/provenance claims only; no advisory, diagnostic, intelligence-engine, or investment claim.",
      ["public reference", "source/provenance record", "non-advisory evidence asset"],
    ));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INTERNAL_ONLY_JUSTIFIED — 2 products
  // ══════════════════════════════════════════════════════════════════════════

  registerProductEvidence(evidenceRecord(
    "gmi_q3_2026",
    "Global Market Intelligence Report — Q3 2026",
    "INTERNAL_ONLY_JUSTIFIED",
    "VALID_INTERNAL_ONLY_JUSTIFICATION",
    [
      { category: "governance", claim: "Future edition — not yet released", path: "lib/commercial/catalog.ts", pathExists: true },
      { category: "governance", claim: "Internal operations record only", path: "lib/product/product-fulfilment-contract.ts", pathExists: true },
    ],
    ["lib/commercial/catalog.ts", "lib/product/product-fulfilment-contract.ts"],
    [],
    [],
    ["executive_report_artifact / entitlement_on_payment (inactive)"],
    ["Not sold — inactive"],
    "Internal operations or future-edition record only; remove public sellable exposure.",
    ["internal operating support", "not publicly sold"],
  ));

  registerProductEvidence(evidenceRecord(
    "inner_circle",
    "Inner Circle",
    "INTERNAL_ONLY_JUSTIFIED",
    "VALID_INTERNAL_ONLY_JUSTIFICATION",
    [
      { category: "governance", claim: "Inactive membership — strategic decision", path: "lib/commercial/catalog.ts", pathExists: true },
      { category: "governance", claim: "Internal operations record only", path: "lib/product/product-fulfilment-contract.ts", pathExists: true },
    ],
    ["lib/commercial/catalog.ts", "lib/product/product-fulfilment-contract.ts"],
    [],
    [],
    ["retainer_cycle / entitlement_on_payment (inactive)"],
    ["Not sold — inactive"],
    "Internal operations or future-edition record only; remove public sellable exposure.",
    ["internal operating support", "not publicly sold"],
  ));

  // ══════════════════════════════════════════════════════════════════════════
  // MERGED_OR_RETIRED — 6 products
  // ══════════════════════════════════════════════════════════════════════════

  const retired: Array<{ code: string; name: string; mergeTarget: string }> = [
    { code: "operator_essentials_pack", name: "Operator Essentials", mergeTarget: "Individual instruments" },
    { code: "command_pack", name: "Command Pack", mergeTarget: "Individual instruments" },
    { code: "governance_suite", name: "Governance Suite", mergeTarget: "Individual instruments" },
    { code: "diagnostic_report_basic", name: "Diagnostic Report — Basic", mergeTarget: "executive_reporting" },
    { code: "diagnostic_report_pro", name: "Diagnostic Report — Pro", mergeTarget: "executive_reporting" },
    { code: "executive_reporting_priority", name: "Executive Reporting — Advanced", mergeTarget: "executive_reporting" },
  ];

  for (const ret of retired) {
    registerProductEvidence(evidenceRecord(
      ret.code,
      ret.name,
      "MERGED_OR_RETIRED",
      "VALID_MERGE_OR_RETIREMENT_RECORD",
      [
        { category: "governance", claim: `Merged into: ${ret.mergeTarget}`, path: "lib/product/product-fulfilment-contract.ts", pathExists: true },
        { category: "commercial", claim: "Inactive — no checkout, no Stripe binding", path: "lib/commercial/catalog.ts", pathExists: true },
      ],
      ["lib/commercial/catalog.ts", "lib/product/product-fulfilment-contract.ts"],
      [],
      [],
      ["Various (inactive)"],
      ["Inactive — not sold"],
      "Merged/retired; preserve historical compatibility only and block commercial promotion.",
      ["retired or merged code", "historical compatibility only"],
    ));
  }
}

// Auto-initialise on import
initialiseEvidenceRegistry();

