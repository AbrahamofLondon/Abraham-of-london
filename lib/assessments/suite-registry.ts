// lib/assessments/suite-registry.ts

export type AssessmentId =
  | "CONSTITUTIONAL"
  | "TEAM"
  | "ENTERPRISE"
  | "EXECUTIVE_REPORTING";

export type AssessmentEntry = {
  id: AssessmentId;
  href: string;
  title: string;
  strapline: string;
  output: string;
  position: string;
};

export const ASSESSMENT_LADDER: readonly AssessmentEntry[] = [
  {
    id: "CONSTITUTIONAL",
    title: "Constitutional Diagnostic",
    href: "/diagnostics/constitutional-diagnostic",
    strapline: "Fast city gate for seriousness, authority, posture, and route.",
    position: "Entry layer",
    output: "Micro-report and route recommendation",
  },
  {
    id: "TEAM",
    title: "Team Assessment",
    href: "/diagnostics/team-assessment",
    strapline: "Multi-respondent evidence for variance, trust, and execution reality.",
    position: "Evidence layer",
    output: "Cross-team signal and variance map",
  },
  {
    id: "ENTERPRISE",
    title: "Enterprise Assessment",
    href: "/diagnostics/enterprise-assessment",
    strapline: "Institution-wide architecture of authority, risk, and operating disorder.",
    position: "Institution layer",
    output: "Enterprise condition and system-wide priorities",
  },
  {
    id: "EXECUTIVE_REPORTING",
    title: "Executive Reporting",
    href: "/diagnostics/executive-reporting",
    strapline: "Board-grade interpretation layer between signal and mandate.",
    position: "Decision layer",
    output: "Board-grade report, PDF, recommendations, intervention candidate",
  },
] as const;
