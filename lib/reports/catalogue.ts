/* lib/reports/catalogue.ts */

export type ReportPackageKey =
  | "directional-integrity"
  | "team-alignment"
  | "enterprise"
  | "executive-reporting";

export type ReportPackage = {
  key: ReportPackageKey;
  label: string;
  title: string;
  description: string;
  amountGbp: number;
  currency: "gbp";
  diagnosticType: string;
  turnaround: string;
  premium: boolean;
};

export const REPORT_PACKAGES: ReportPackage[] = [
  {
    key: "directional-integrity",
    label: "Personal",
    title: "Directional Integrity Report",
    description:
      "A structured report translating personal diagnostic signal into correction priorities, behavioural gaps, and next-step logic.",
    amountGbp: 149,
    currency: "gbp",
    diagnosticType: "directional-integrity",
    turnaround: "3 working days",
    premium: false,
  },
  {
    key: "team-alignment",
    label: "Team",
    title: "Team Alignment Report",
    description:
      "A leadership-grade report for team coherence, execution drag, accountability slippage, and alignment weakness.",
    amountGbp: 495,
    currency: "gbp",
    diagnosticType: "team-alignment",
    turnaround: "5 working days",
    premium: true,
  },
  {
    key: "enterprise",
    label: "Enterprise",
    title: "Enterprise Diagnostic Report",
    description:
      "A board-grade interpretation of organisational fragility, team variance, leadership gap, and escalation priority.",
    amountGbp: 1450,
    currency: "gbp",
    diagnosticType: "enterprise",
    turnaround: "7 working days",
    premium: true,
  },
  {
    key: "executive-reporting",
    label: "Flagship",
    title: "Executive Reporting Package",
    description:
      "Premium executive reporting for boards, founders, and institutions requiring a narrative, matrix, exposure model, and correction architecture.",
    amountGbp: 2950,
    currency: "gbp",
    diagnosticType: "executive-reporting",
    turnaround: "7–10 working days",
    premium: true,
  },
];

export function getReportPackage(key: string | null | undefined): ReportPackage | null {
  if (!key) return null;
  return REPORT_PACKAGES.find((p) => p.key === key) || null;
}