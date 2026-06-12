import { PRODUCT_FULFILMENT_CONTRACTS } from "@/lib/product/product-fulfilment-contract";
import {
  defineReportExperienceStandard,
  type ArrivalVariant,
  type ReportExperienceStandard,
  type ReportTier,
} from "./report-experience-standard";

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
};

const productContractsByCode = new Map(
  PRODUCT_FULFILMENT_CONTRACTS.map((contract) => [contract.productCode, contract]),
);

function routeFor(productCode: string, field: "customerAccessRoute" | "adminRoute"): string {
  return productContractsByCode.get(productCode)?.[field] ?? "/admin/fulfilment";
}

function entry(input: Omit<ReportOutputRegistryEntry, "standard">): ReportOutputRegistryEntry {
  return {
    ...input,
    standard: defineReportExperienceStandard({
      reportCode: input.reportCode,
      productCode: input.productCode,
      tier: input.reportStandardTier,
      format: input.outputType === "both" ? "both" : input.outputType,
      arrivalVariant: input.arrivalVariant,
    }),
  };
}

const PRIMARY_REPORT_OUTPUT_REGISTRY: ReportOutputRegistryEntry[] = [
  entry({
    reportCode: "boardroom_dossier",
    productCode: "boardroom_brief",
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
  }),
  entry({
    reportCode: "executive_client_report",
    productCode: "executive_reporting",
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
  }),
  entry({
    reportCode: "gmi_q1_2026_institutional_report",
    productCode: "gmi_q1_2026",
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
  }),
  entry({
    reportCode: "strategy_room_session_report",
    productCode: "strategy_room",
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
  }),
  entry({
    reportCode: "retainer_oversight_cycle",
    productCode: "retainer_core",
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
  }),
  entry({
    reportCode: "professional_status_report",
    productCode: "professional",
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
  }),
  entry({
    reportCode: "decision_instrument_result",
    productCode: "decision_exposure_instrument",
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
  }),
  entry({
    reportCode: "return_brief_case",
    productCode: "professional",
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
  }),
  entry({
    reportCode: "fast_diagnostic_result",
    productCode: "fast_diagnostic",
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
