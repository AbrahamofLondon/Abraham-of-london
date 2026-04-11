// lib/server/billing/executive-reporting-entitlements.ts
import "server-only";
import { getAssessmentSuiteEntitlements } from "@/lib/server/billing/assessment-suite-entitlements";

export async function getExecutiveReportingEntitlements(email: string) {
  const suite = await getAssessmentSuiteEntitlements(email);

  return {
    canDownloadSample: suite.executiveReportSampleDownload,
    canViewFullReport: suite.executiveReportFull || suite.executiveReporting,
    canExportBoardroomPdf: suite.executiveBoardroomPdf,
    canExportIntervention: suite.executiveInterventionExport,
    canAccessStrategyRoomArtefacts: suite.strategyRoomArtifacts,
  };
}