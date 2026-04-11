// lib/server/billing/assessment-suite-entitlements.ts
import "server-only";
import { hasEntitlement } from "@/lib/server/billing/entitlements";

export interface AssessmentSuiteEntitlements {
  constitutionalDiagnostic: boolean;
  teamAssessment: boolean;
  enterpriseAssessment: boolean;
  executiveReporting: boolean;
  executiveReportSampleDownload: boolean;
  executiveReportFull: boolean;
  executiveBoardroomPdf: boolean;
  executiveInterventionExport: boolean;
  strategyRoomArtifacts: boolean;
}

export async function getAssessmentSuiteEntitlements(
  email: string,
): Promise<AssessmentSuiteEntitlements> {
  const normalized = email.trim().toLowerCase();

  const [
    constitutionalDiagnostic,
    teamAssessment,
    enterpriseAssessment,
    executiveReporting,
    executiveReportSampleDownload,
    executiveReportFull,
    executiveBoardroomPdf,
    executiveInterventionExport,
    strategyRoomArtifacts,
  ] = await Promise.all([
    hasEntitlement(normalized, "assessment.constitutional"),
    hasEntitlement(normalized, "assessment.team"),
    hasEntitlement(normalized, "assessment.enterprise"),
    hasEntitlement(normalized, "assessment.executive_reporting"),
    hasEntitlement(normalized, "executive-report.sample-download"),
    hasEntitlement(normalized, "executive-report.full"),
    hasEntitlement(normalized, "executive-report.boardroom-pdf"),
    hasEntitlement(normalized, "executive-report.intervention-export"),
    hasEntitlement(normalized, "strategy-room.private-artefacts"),
  ]);

  return {
    constitutionalDiagnostic,
    teamAssessment,
    enterpriseAssessment,
    executiveReporting,
    executiveReportSampleDownload,
    executiveReportFull,
    executiveBoardroomPdf,
    executiveInterventionExport,
    strategyRoomArtifacts,
  };
}