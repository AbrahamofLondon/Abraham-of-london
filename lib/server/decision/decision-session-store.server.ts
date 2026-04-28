import "server-only";

import { prisma } from "@/lib/prisma";

export async function loadDecisionSessionBridge(reportId: string) {
  const report = await prisma.constitutionalIntakeReport.findUnique({
    where: { id: reportId },
    select: {
      bridgeJson: true,
      reportJson: true,
      route: true,
      posture: true,
    },
  });

  if (!report) return null;

  return {
    bridge: report.bridgeJson ? JSON.parse(report.bridgeJson) : null,
    report: report.reportJson ? JSON.parse(report.reportJson) : null,
    route: report.route,
    posture: report.posture,
  };
}
