import { PRODUCT_FULFILMENT_CONTRACTS } from "@/lib/product/product-fulfilment-contract";
import {
  defineReportExperienceStandard,
  type ArrivalVariant,
  type ReportExperienceStandard,
  type ReportTier,
} from "./report-experience-standard";
import {
  evaluateGoldStandardStatus,
  mergeGoldStandardScore,
  GOLD_STANDARD_BASE_SCORE,
  PREMIUM_GOLD_STANDARD_SCORE,
  FREE_SIGNAL_SCORE,
  type ReportExperienceAuthorityProfile,
  type ReportExperienceCommercialTier,
  type ReportExperienceOutputFormat,
  type ReportExperienceGoldStandardScore,
} from "./report-experience-gold-standard";

export type ReportOutputType = "pdf" | "web" | "both";

export type ReportOutputRegistryEntry = {
  reportCode: string;
  productCode: string;
  generatorPath: string;
  outputType: ReportOutputType;
  requiredInput: string[];
  artifactType: string;
  customerAccessRoute: string;
  adminPreviewRoute: string;
  pdfGenerationRoute: string;
  webViewRoute?: string;
  testFixturePath: string;
  reportStandardTier: ReportTier;
  arrivalImplemented: boolean;
  arrivalVariant: ArrivalVariant;
  standard: ReportExperienceStandard;
  authorityProfile: ReportExperienceAuthorityProfile;
};

const productContractsByCode = new Map(
  PRODUCT_FULFILMENT_CONTRACTS.map((contract) => [contract.productCode, contract]),
);

function routeFor(productCode: string, field: "customerAccessRoute" | "adminRoute"): string {
  return productContractsByCode.get(productCode)?.[field] ?? "/admin/fulfilment";
}

function tierToCommercialTier(tier: ReportTier): ReportExperienceCommercialTier {
  if (tier === "boardroom") return "enterprise";
  if (tier === "executive") return "paid_premium";
  if (tier === "retainer") return "retainer";
  if (tier === "paid") return "paid_entry";
  return "free";
}

function outputTypeToFormats(outputType: ReportOutputType): ReportExperienceOutputFormat[] {
  if (outputType === "both") return ["web", "pdf", "download"];
  if (outputType === "pdf") return ["pdf", "download"];
  return ["web"];
}

function buildAuthorityProfile(
  input: Omit<ReportOutputRegistryEntry, "standard" | "authorityProfile"> & {
    outputName: string;
    scoreOverrides?: Partial<ReportExperienceGoldStandardScore>;
    boolOverrides?: Partial<Omit<ReportExperienceAuthorityProfile, "outputCode" | "outputName" | "commercialTier" | "outputFormat" | "goldStandardScore" | "goldStandardStatus" | "upgradeRequiredBeforeScale">>;
    notes?: string[];
  },
): ReportExperienceAuthorityProfile {
  const commercialTier = tierToCommercialTier(input.reportStandardTier);
  const outputFormat = outputTypeToFormats(input.outputType);
  const hasPdf = outputFormat.includes("pdf");

  const baseScore =
    commercialTier === "enterprise" || commercialTier === "paid_premium" || commercialTier === "retainer"
      ? PREMIUM_GOLD_STANDARD_SCORE
      : commercialTier === "free"
      ? FREE_SIGNAL_SCORE
      : GOLD_STANDARD_BASE_SCORE;

  const score = mergeGoldStandardScore(baseScore, input.scoreOverrides ?? {});

  const boolDefaults = {
    arrivalImplemented: input.arrivalImplemented,
    identityBlockImplemented: score.identity >= 2,
    preparedForImplemented: score.identity >= 3,
    executiveFramingImplemented: score.executiveFraming >= 2,
    clientSpecificityImplemented: score.clientSpecificity >= 2,
    evidenceLayerImplemented: score.evidenceAndProvenance >= 2,
    provenanceLayerImplemented: score.evidenceAndProvenance >= 3,
    forensicTraceabilityImplemented: score.forensicTraceability >= 2,
    mobileExperienceReviewed: score.mobileReadability >= 2,
    pdfExperienceReviewed: hasPdf ? score.pdfReadability >= 2 : true,
    adminPreviewSafe: score.adminPreviewSafety >= 2,
    archiveSafe: score.archiveReadiness >= 2,
    feedbackLoopImplemented: score.feedbackLoop >= 2,
  };

  const bools = { ...boolDefaults, ...input.boolOverrides };

  const goldStandardStatus = evaluateGoldStandardStatus({
    commercialTier,
    outputFormat,
    score,
    arrivalImplemented: bools.arrivalImplemented,
    preparedForImplemented: bools.preparedForImplemented,
    executiveFramingImplemented: bools.executiveFramingImplemented,
    deliveryStateClarityImplemented: score.deliveryStateClarity >= 2,
    feedbackLoopImplemented: bools.feedbackLoopImplemented,
    adminPreviewSafe: bools.adminPreviewSafe,
  });

  return {
    outputCode: input.reportCode,
    outputName: input.outputName,
    commercialTier,
    outputFormat,
    ...bools,
    goldStandardScore: score,
    goldStandardStatus,
    upgradeRequiredBeforeScale: goldStandardStatus === "needs_upgrade" || goldStandardStatus === "not_safe_for_paid_delivery",
    notes: input.notes,
  };
}

function entry(
  input: Omit<ReportOutputRegistryEntry, "standard" | "authorityProfile"> & {
    outputName: string;
    scoreOverrides?: Partial<ReportExperienceGoldStandardScore>;
    boolOverrides?: Partial<Omit<ReportExperienceAuthorityProfile, "outputCode" | "outputName" | "commercialTier" | "outputFormat" | "goldStandardScore" | "goldStandardStatus" | "upgradeRequiredBeforeScale">>;
    notes?: string[];
  },
): ReportOutputRegistryEntry {
  const { outputName, scoreOverrides, boolOverrides, notes, ...base } = input;
  return {
    ...base,
    standard: defineReportExperienceStandard({
      reportCode: input.reportCode,
      productCode: input.productCode,
      tier: input.reportStandardTier,
      format: input.outputType === "both" ? "both" : input.outputType,
      arrivalVariant: input.arrivalVariant,
    }),
    authorityProfile: buildAuthorityProfile({ ...input, outputName, scoreOverrides, boolOverrides, notes }),
  };
}

const PRIMARY_REPORT_OUTPUT_REGISTRY: ReportOutputRegistryEntry[] = [
  entry({
    reportCode: "boardroom_dossier",
    productCode: "boardroom_brief",
    outputName: "Boardroom Dossier",
    generatorPath: "lib/boardroom/dossier-pdf.tsx",
    outputType: "both",
    requiredInput: ["organisationId", "period", "executiveSummary"],
    artifactType: "BoardroomBriefOrder",
    customerAccessRoute: "/boardroom/dossier/[dossierId]",
    adminPreviewRoute: "/admin/boardroom/orders/[id]",
    pdfGenerationRoute: "/api/boardroom/dossier/pdf",
    webViewRoute: "/boardroom/dossier/[dossierId]",
    testFixturePath: "tests/reporting/fixtures/boardroom-dossier-fixture.ts",
    reportStandardTier: "boardroom",
    arrivalImplemented: true,
    arrivalVariant: "transmission",
    scoreOverrides: {
      // PDF is gold-standard; web page is the weak surface — combined score reflects worst surface
      arrival: 1,            // Web: no arrival screen; PDF: n/a — score reflects web gap
      identity: 2,           // PDF: 3 (prepared-for, ref ID); web: 2 (org name + ref ID added)
      clientSpecificity: 2,  // Org name present; individual client name conditional
      executiveFraming: 3,   // PDF: 13-section executive judgement structure
      decisionUsefulness: 3, // Decision paths, next move, evidence gaps — full decision architecture
      evidenceAndProvenance: 3, // PDF: artifact hash, scope note, evidence gaps, falsification
      forensicTraceability: 2,  // PDF: hash field present (conditional on caller); web: absent
      visualAuthority: 3,    // Cormorant Garamond, brass palette, full PDF typography
      mobileReadability: 1,  // Web: inline styles, no responsive classes
      pdfReadability: 3,     // Full PDF: cover, transmission, 13 sections, footer
      archiveReadiness: 2,   // Reference ID + classification on PDF; web lacks
      adminPreviewSafety: 1, // Admin preview route exists; no preview banner/guard in page
      deliveryStateClarity: 2, // PDF: DELIVERED lifecycle; web: readiness state shown (with fix)
      feedbackLoop: 1,       // PDF: text-only feedback instruction; web: challenge note added (not interactive)
      reuseAndForwardability: 3, // Classified PDF designed for board circulation
    },
    notes: [
      "PDF surface is the strongest artefact — cover, transmission note, 13 sections, artifact hash slot, reference ID on every page",
      "Web surface (pages/boardroom/[sessionId].tsx) lacks arrival screen — reference ID and classification label added this phase",
      "Feedback is text-only on both surfaces — no interactive widget",
      "Mobile layout uses inline styles without responsive breakpoints — needs Tailwind refactor",
      "Admin preview banner absent — operator should not preview boardroom content without explicit guard",
      "Upgrade path: add ArrivalScreen to web page; add FeedbackWidget; add adminPreviewSafe guard",
    ],
  }),
  entry({
    reportCode: "executive_client_report",
    productCode: "executive_reporting",
    outputName: "Executive Client Report",
    generatorPath: "app/client/reports/[reportId]/ClientReportClient.tsx",
    outputType: "web",
    requiredInput: ["reportId", "token"],
    artifactType: "ExecutiveReportingRun",
    customerAccessRoute: routeFor("executive_reporting", "customerAccessRoute"),
    adminPreviewRoute: routeFor("executive_reporting", "adminRoute"),
    pdfGenerationRoute: "/api/campaigns/[id]/report/pdf",
    webViewRoute: "/client/reports/[reportId]",
    testFixturePath: "tests/reporting/fixtures/executive-report-fixture.ts",
    reportStandardTier: "executive",
    arrivalImplemented: true,
    arrivalVariant: "sealed",
    scoreOverrides: {
      arrival: 3,            // ArrivalScreen with tier="executive", referenceId, weightStatement
      identity: 2,           // "Prepared for [name]" added this phase; clientName from API
      clientSpecificity: 2,  // clientName rendered; no organisation-level specificity
      executiveFraming: 2,   // Opening judgement, state badge, mandate — solid but not 3
      decisionUsefulness: 2, // Priority stack, failure modes, action items present
      evidenceAndProvenance: 1, // No evidence sourcing beyond snapshot — gap
      forensicTraceability: 0,  // No artifact hash in report model
      visualAuthority: 2,    // Dark bg, amber/mono typography, state badges — premium but not institutional
      mobileReadability: 2,  // grid-cols-1 sm:grid-cols-3 fixed this phase
      archiveReadiness: 1,   // Token-based access — no archive/download path
      adminPreviewSafety: 1, // No preview banner; admin accesses same token-gated URL
      deliveryStateClarity: 3, // Delivery State panel + "treat as decision support until operator-approved"
      feedbackLoop: 3,       // FeedbackWidget wired with surface, subjectType, artifactId, productCode
      reuseAndForwardability: 1, // Web-only; no PDF; token link not easily forwarded
    },
    notes: [
      "ArrivalScreen added with customerName, referenceId, weightStatement — arrival gap closed",
      "'Prepared for [name]' added this phase — requires fullName present in ExecutiveReportingRun DB record",
      "grid-cols-3 fixed to grid-cols-1 sm:grid-cols-3 for mobile",
      "onComplete now triggers /api/client/reports/[id]/view POST instead of no-op",
      "Forensic traceability absent — ExecutiveReportingRun model has no hash field",
      "Evidence/provenance is snapshot data only — no sourcing layer",
      "Upgrade path: add hash to ER run; add PDF output; improve executive framing depth",
    ],
  }),
  entry({
    reportCode: "gmi_q1_2026_institutional_report",
    productCode: "gmi_q1_2026",
    outputName: "Global Market Intelligence Q1 2026",
    generatorPath: "lib/pdf/global-market-intelligence-report-q1-2026-pdf.tsx",
    outputType: "both",
    requiredInput: ["edition", "issueDate"],
    artifactType: "ProductArtifact",
    customerAccessRoute: routeFor("gmi_q1_2026", "customerAccessRoute"),
    adminPreviewRoute: routeFor("gmi_q1_2026", "adminRoute"),
    pdfGenerationRoute: "/api/gmi/board-pack",
    webViewRoute: "/intelligence/global-market-intelligence-q1-2026",
    testFixturePath: "tests/reporting/fixtures/gmi-report-fixture.ts",
    reportStandardTier: "executive",
    arrivalImplemented: true,
    arrivalVariant: "intelligence",
    scoreOverrides: {
      arrival: 0,             // No arrival screen on web page; PDF not applicable
      identity: 1,            // Lifecycle badge plumbed; no prepared-for or subscriber personalisation
      clientSpecificity: 0,   // Intelligence product — not client-specific by design, but no subscriber identity
      executiveFraming: 2,    // 4 scenarios with probability weights — solid intelligence framing
      decisionUsefulness: 2,  // Scenario analysis is decision-relevant; no actionable next step shown
      evidenceAndProvenance: 1, // Inline data; no methodology note or sourcing visible
      forensicTraceability: 1,  // Doc ID "GMI-Q1-2026" provides reference; no hash
      visualAuthority: 3,     // Full grain, motion tokens, Cormorant/JetBrains, gold palette
      mobileReadability: 1,   // Layout wrapper present; no explicit responsive evidence
      pdfReadability: 2,      // Cover page + doc metadata + section structure present
      archiveReadiness: 2,    // Archive warning added to public artifact page; doc ID present
      adminPreviewSafety: 0,  // No preview guard visible
      deliveryStateClarity: 1, // Lifecycle badge plumbed; no explicit ARCHIVED banner on web
      feedbackLoop: 0,        // No feedback widget
      reuseAndForwardability: 2, // PDF with doc ID and classification — forwardable
    },
    notes: [
      "Archived Q1 2026 product — archive warning banner added to pages/artifacts/ page",
      "arrival screen deferred by design — intelligence web page uses direct content layout; arrival upgrade tracked as AMBER item",
      "No subscriber personalisation — GMI is institutional product, not client-specific",
      "No methodology note visible on web or PDF surface",
      "No feedback widget on web page",
      "Upgrade path: add arrival screen; add methodology/caveat block; add feedback widget; explicit ARCHIVED banner",
    ],
  }),
  entry({
    reportCode: "strategy_room_session_report",
    productCode: "strategy_room",
    outputName: "Strategy Room Session Report",
    generatorPath: "pages/strategy-room/session/[id].tsx",
    outputType: "web",
    requiredInput: ["sessionId", "decisionContext"],
    artifactType: "ProductArtifact",
    customerAccessRoute: routeFor("strategy_room", "customerAccessRoute"),
    adminPreviewRoute: routeFor("strategy_room", "adminRoute"),
    pdfGenerationRoute: "/api/campaigns/[id]/report/pdf",
    webViewRoute: "/strategy-room/session/[id]",
    testFixturePath: "tests/reporting/fixtures/strategy-room-fixture.ts",
    reportStandardTier: "executive",
    arrivalImplemented: true,
    arrivalVariant: "sealed",
    scoreOverrides: {
      arrival: 3,            // 3-state gate: GATE → ENTRY BRIEF → EXECUTION CHAMBER
      identity: 3,           // ClientIntelligenceStack + entitlement authority
      clientSpecificity: 3,  // Evidence capture carry-forward, canonical sections
      executiveFraming: 3,   // Escalation level, dominant condition, directive
      decisionUsefulness: 3, // ExecutionFlow, AIInterventionSuggestions, LimitationsBlock
      evidenceAndProvenance: 3, // EvidenceStrengthMeter, GovernanceEvidenceCarryForward
      forensicTraceability: 2, // Governance event bus; no visible hash on page
      visualAuthority: 3,    // Cormorant/JetBrains Mono, gold tokens, clamp sizing
      mobileReadability: 2,  // clamp + lg:grid-cols; not fully verified at narrow widths
      archiveReadiness: 1,   // Session-based, not versioned/archived
      adminPreviewSafety: 2, // AdmissionNotice, RetainerEntryGate — partial guard
      deliveryStateClarity: 3, // DecisionStateBanner, CaseActiveBanner, checkout confirmation
      feedbackLoop: 3,       // FeedbackLoopBlock wired
      reuseAndForwardability: 1, // Web-only execution environment; not designed for forwarding
    },
    notes: [
      "Highest production maturity of all assessed surfaces — gate, evidence, execution, and feedback all wired",
      "Mobile: clamp sizing and lg:grid-cols used — spot-check at 375px needed",
      "Forensic hash not surfaced on web page despite governance event bus existing",
      "Not designed for forwarding/archiving — execution environment, not a static report",
    ],
  }),
  entry({
    reportCode: "retainer_oversight_cycle",
    productCode: "retainer_core",
    outputName: "Retainer Oversight Brief",
    generatorPath: "lib/pdf/oversight-brief-pdf.tsx",
    outputType: "both",
    requiredInput: ["cycleId", "clientId", "decisionMemory"],
    artifactType: "OversightReviewCycle",
    customerAccessRoute: "/retainers/status/[token]",
    adminPreviewRoute: "/admin/retainers",
    pdfGenerationRoute: "/api/pdf/oversight-brief",
    webViewRoute: "/oversight/brief/[cycleId]",
    testFixturePath: "tests/reporting/fixtures/oversight-brief-fixture.ts",
    reportStandardTier: "retainer",
    arrivalImplemented: true,
    arrivalVariant: "sealed",
    scoreOverrides: {
      arrival: 2,            // Arrival variant declared; web experience not verified
      identity: 2,           // brandName + ClientSafeOversightBrief type; no explicit "prepared for"
      clientSpecificity: 2,  // Typed from ClientSafeOversightBrief — client-scoped data
      executiveFraming: 2,   // Title, metaRow, section structure — functional but not institutional
      decisionUsefulness: 2, // Row/badge/label pattern — structured but depth unverified
      evidenceAndProvenance: 2, // row/label/badge pattern for evidence rows
      forensicTraceability: 1, // Reference ID in meta; no hash field visible
      visualAuthority: 2,    // Gold accent, serif brand name — clean, restrained, not boardroom-grade
      mobileReadability: 0,  // PDF-only surface — mobile N/A
      pdfReadability: 2,     // Functional PDF structure with header, meta rows, gold rule
      archiveReadiness: 2,   // PDF with reference fields; cycle-based longitudinal product
      adminPreviewSafety: 1, // No preview guard visible in PDF styles
      deliveryStateClarity: 1, // No DRAFT watermark or LIVE/ARCHIVED status in PDF
      feedbackLoop: 1,       // No interactive feedback — retainer lifecycle implies operator-managed
      reuseAndForwardability: 2, // PDF designed for institutional circulation
    },
    notes: [
      "PDF renderer is production-quality for style layer — depends on ClientSafeOversightBrief data completeness",
      "Web oversight experience (/oversight/brief/[cycleId]) not directly assessed — verify arrival screen implementation",
      "Delivery state clarity gap: no DRAFT watermark in PDF; oversight cycle state not surfaced",
      "Upgrade path: add delivery state label to PDF; add 'prepared for' explicitly; add longitudinal indicators",
    ],
  }),
  entry({
    reportCode: "professional_status_report",
    productCode: "professional",
    outputName: "Professional Case Status Report",
    generatorPath: "pages/decision-centre/case/[caseId].tsx",
    outputType: "web",
    requiredInput: ["caseId", "clientId"],
    artifactType: "ProductArtifact",
    customerAccessRoute: routeFor("professional", "customerAccessRoute"),
    adminPreviewRoute: routeFor("professional", "adminRoute"),
    pdfGenerationRoute: "/api/pdf/oversight-brief",
    webViewRoute: "/decision-centre/case/[caseId]",
    testFixturePath: "tests/reporting/fixtures/professional-status-fixture.ts",
    reportStandardTier: "retainer",
    arrivalImplemented: true,
    arrivalVariant: "sealed",
    scoreOverrides: {
      // Decision-centre case view — arrival declared but not code-verified on this path
      arrival: 2,            // Arrival variant declared in registry; web not directly assessed
      identity: 2,           // Case-scoped; client identity expected from caseId
      clientSpecificity: 2,  // Case-level specificity
      executiveFraming: 2,   // Decision-centre framing expected; not code-verified
      decisionUsefulness: 2,
      evidenceAndProvenance: 2,
      forensicTraceability: 1,
      visualAuthority: 2,
      mobileReadability: 1,  // Not verified
      archiveReadiness: 1,
      adminPreviewSafety: 1,
      deliveryStateClarity: 2,
      feedbackLoop: 1,
      reuseAndForwardability: 1,
    },
    notes: [
      "Decision-centre case view not directly assessed in this phase — scores are conservative estimates",
      "Upgrade: verify arrival screen on /decision-centre/case/[caseId]; verify client identity display",
    ],
  }),
  entry({
    reportCode: "decision_instrument_result",
    productCode: "decision_exposure_instrument",
    outputName: "Decision Exposure Instrument Result",
    generatorPath: "pages/decision-instruments/decision-exposure-instrument/run.tsx",
    outputType: "web",
    requiredInput: ["entitlement", "instrumentResponse"],
    artifactType: "ProductArtifact",
    customerAccessRoute: routeFor("decision_exposure_instrument", "customerAccessRoute"),
    adminPreviewRoute: routeFor("decision_exposure_instrument", "adminRoute"),
    pdfGenerationRoute: "/api/pdf/decision-instrument-dossier",
    webViewRoute: "/decision-instruments/decision-exposure-instrument/run",
    testFixturePath: "tests/reporting/fixtures/decision-instrument-fixture.ts",
    reportStandardTier: "paid",
    arrivalImplemented: true,
    arrivalVariant: "brief",
    notes: ["Paid-entry decision instrument — part of operator_decision_pack bundle"],
  }),
  entry({
    reportCode: "return_brief_case",
    productCode: "professional",
    outputName: "Return Brief Case",
    generatorPath: "pages/return-brief/[caseId].tsx",
    outputType: "web",
    requiredInput: ["caseId", "outcomeHypothesis"],
    artifactType: "OutcomeHypothesis",
    customerAccessRoute: "/return-brief/[caseId]",
    adminPreviewRoute: "/admin/decision-centre",
    pdfGenerationRoute: "/api/pdf/proof-pack",
    webViewRoute: "/return-brief/[caseId]",
    testFixturePath: "tests/reporting/fixtures/return-brief-fixture.ts",
    reportStandardTier: "paid",
    arrivalImplemented: true,
    arrivalVariant: "brief",
    notes: ["Return brief tied to professional case — proof pack output path"],
  }),
  entry({
    reportCode: "fast_diagnostic_result",
    productCode: "fast_diagnostic",
    outputName: "Fast Diagnostic Result",
    generatorPath: "components/diagnostics/AssessmentResultSurface.tsx",
    outputType: "web",
    requiredInput: ["assessment"],
    artifactType: "ProductArtifact",
    customerAccessRoute: routeFor("fast_diagnostic", "customerAccessRoute"),
    adminPreviewRoute: routeFor("fast_diagnostic", "adminRoute"),
    pdfGenerationRoute: "/api/diagnostics/report/pdf",
    webViewRoute: "/diagnostics/[id]",
    testFixturePath: "tests/reporting/fixtures/fast-diagnostic-fixture.ts",
    reportStandardTier: "free",
    arrivalImplemented: true,
    arrivalVariant: "signal",
    scoreOverrides: {
      arrival: 0,            // Post-arrival component by design — arrival handled by parent
      identity: 2,           // AssessmentResult-typed, surfaceFromAssessmentKind
      clientSpecificity: 2,  // Assessment-scoped
      executiveFraming: 3,   // CommercialExposurePanel, ResultPathwayPanel, BenchmarkContextPanel
      decisionUsefulness: 3, // SaveCaseConversionPanel, pathway state
      evidenceAndProvenance: 3, // PosturePill, describeEvidencePosture, evidenceState
      forensicTraceability: 1, // recordStatusLabel present; no hash
      visualAuthority: 3,    // GoldDivider, SectionLabel, typed tokens
      mobileReadability: 1,  // Not verified in assessment
      archiveReadiness: 1,   // Free diagnostic — not designed for long-term archiving
      adminPreviewSafety: 1,
      deliveryStateClarity: 2, // recordStatusLabel present
      feedbackLoop: 3,       // FeedbackWidget imported and present
      reuseAndForwardability: 2, // Free signal; forwardable but not citation-grade
    },
    notes: [
      "Post-arrival component — arrival handled by parent diagnostic flow (arrival=0 is by design)",
      "Highest quality free-tier surface: full evidence posture, feedback widget, commercial exposure panel",
      "Mobile layout not verified at narrow widths",
    ],
  }),
];

const primaryProductCodes = new Set(
  PRIMARY_REPORT_OUTPUT_REGISTRY.map((output) => output.productCode),
);

function tierForProductCode(productCode: string, commercialStatus: string): ReportTier {
  if (productCode === "boardroom_brief") return "boardroom";
  if (productCode.startsWith("gmi_")) return "executive";
  if (productCode.includes("strategy_room")) return "executive";
  if (productCode.includes("executive_reporting")) return "executive";
  if (productCode.includes("professional") || productCode.includes("retainer") || commercialStatus === "contracted") {
    return "retainer";
  }
  return "paid";
}

function arrivalVariantForTier(tier: ReportTier, productCode: string): ArrivalVariant {
  if (productCode.startsWith("gmi_")) return "intelligence";
  if (tier === "boardroom") return "transmission";
  if (tier === "executive" || tier === "retainer") return "sealed";
  if (tier === "free") return "signal";
  return "brief";
}

const CONTRACT_BACKED_REPORT_OUTPUTS: ReportOutputRegistryEntry[] = PRODUCT_FULFILMENT_CONTRACTS.filter((contract) => {
  if (primaryProductCodes.has(contract.productCode)) return false;
  if (contract.readinessStatus === "not_applicable") return false;
  if (contract.commercialStatus === "free_controlled") return false;
  if (contract.commercialStatus === "inactive") return false;
  return ["paid", "contracted", "manual_billing"].includes(contract.commercialStatus);
}).map((contract) => {
  const tier = tierForProductCode(contract.productCode, contract.commercialStatus);
  return entry({
    reportCode: `${contract.productCode}_report_output`,
    productCode: contract.productCode,
    outputName: contract.productCode.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    generatorPath: contract.customerAccessRoute ?? contract.adminRoute ?? "manual-delivery",
    outputType: contract.fulfilmentType === "interactive_instrument" ? "web" : "both",
    requiredInput: ["entitlement", "productCode"],
    artifactType: contract.artifactModel ?? "ProductArtifact",
    customerAccessRoute: contract.customerAccessRoute ?? "/account",
    adminPreviewRoute: contract.adminRoute ?? "/admin/fulfilment",
    pdfGenerationRoute: contract.artifactModel ? "/api/pdf/proof-pack" : "/api/pdf/decision-instrument-dossier",
    webViewRoute: contract.customerAccessRoute ?? undefined,
    testFixturePath: "tests/reporting/fixtures/report-output-fixture.ts",
    reportStandardTier: tier,
    arrivalImplemented: true,
    arrivalVariant: arrivalVariantForTier(tier, contract.productCode),
    notes: [`Auto-generated from product contract — ${contract.productCode}. Score uses tier default baseline.`],
  });
});

export const REPORT_OUTPUT_REGISTRY: ReportOutputRegistryEntry[] = [
  ...PRIMARY_REPORT_OUTPUT_REGISTRY,
  ...CONTRACT_BACKED_REPORT_OUTPUTS,
];

export function getReportOutputEntry(reportCode: string): ReportOutputRegistryEntry | undefined {
  return REPORT_OUTPUT_REGISTRY.find((entry) => entry.reportCode === reportCode);
}

export function getReportOutputEntriesByProductCode(
  productCode: string,
): ReportOutputRegistryEntry[] {
  return REPORT_OUTPUT_REGISTRY.filter((entry) => entry.productCode === productCode);
}

export function isReportOutputSellable(entry: Pick<ReportOutputRegistryEntry, "reportStandardTier" | "arrivalImplemented">): boolean {
  return entry.reportStandardTier === "free" || entry.arrivalImplemented;
}

export function paidProductCodesMissingReportOutput(): string[] {
  const registeredProductCodes = new Set(REPORT_OUTPUT_REGISTRY.map((entry) => entry.productCode));
  return PRODUCT_FULFILMENT_CONTRACTS.filter((contract) => {
    if (contract.readinessStatus === "not_applicable") return false;
    if (contract.commercialStatus === "free_controlled") return false;
    if (contract.commercialStatus === "inactive") return false;
    return ["paid", "contracted", "manual_billing"].includes(contract.commercialStatus);
  })
    .filter((contract) => !registeredProductCodes.has(contract.productCode))
    .map((contract) => contract.productCode);
}
