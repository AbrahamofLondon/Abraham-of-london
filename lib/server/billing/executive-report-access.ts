// server-only guard removed — Pages Router incompatible
import { hasEntitlement, PRODUCT_CODES } from "@/lib/server/billing/entitlements";

export async function getExecutiveReportAccess(email: string) {
  const [
    canDownloadSample,
    canViewFullReport,
    canExportBoardroomPdf,
    canExportInterventions,
    canAccessStrategyArtefacts,
  ] = await Promise.all([
    hasEntitlement(email, PRODUCT_CODES.EXECUTIVE_REPORT_SAMPLE),
    hasEntitlement(email, PRODUCT_CODES.EXECUTIVE_REPORT_FULL),
    hasEntitlement(email, PRODUCT_CODES.BOARDROOM_PDF),
    hasEntitlement(email, PRODUCT_CODES.INTERVENTION_EXPORTS),
    hasEntitlement(email, PRODUCT_CODES.STRATEGY_ROOM_PRIVATE_ARTEFACTS),
  ]);

  return {
    canDownloadSample,
    canViewFullReport,
    canExportBoardroomPdf,
    canExportInterventions,
    canAccessStrategyArtefacts,
  };
}
