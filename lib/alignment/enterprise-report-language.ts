lib/alignment/enterprise-report-language.ts

import {
  ENTERPRISE_ALIGNMENT_DOMAIN_LABELS,
  type EnterpriseDashboardView,
  type EnterpriseOrganisationSnapshotView,
} from "./enterprise-types";

export type EnterpriseNarrative = {
  executivePosture: string;
  organisationalInterpretation: string;
  leadershipGapCommentary: string;
  varianceCommentary: string;
  interventionTitle: string;
  interventionBody: string;
  advisoryCtaTitle: string;
  advisoryCtaBody: string;
};

function domainList(domains: string[]): string {
  if (!domains.length) return "no major weak domain";
  if (domains.length === 1) return ENTERPRISE_ALIGNMENT_DOMAIN_LABELS[domains[0] as keyof typeof ENTERPRISE_ALIGNMENT_DOMAIN_LABELS] || domains[0];
  if (domains.length === 2) {
    return `${ENTERPRISE_ALIGNMENT_DOMAIN_LABELS[domains[0] as keyof typeof ENTERPRISE_ALIGNMENT_DOMAIN_LABELS] || domains[0]} and ${ENTERPRISE_ALIGNMENT_DOMAIN_LABELS[domains[1] as keyof typeof ENTERPRISE_ALIGNMENT_DOMAIN_LABELS] || domains[1]}`;
  }
  return domains.join(", ");
}

export function buildEnterpriseNarrative(
  dashboard: EnterpriseDashboardView
): EnterpriseNarrative {
  const snapshot = dashboard.organisationSnapshot;
  const gap = dashboard.leadershipGap;

  if (!snapshot) {
    return {
      executivePosture: "No campaign signal has yet been established.",
      organisationalInterpretation: "The organisation has not yet produced a completed response set sufficient for executive interpretation.",
      leadershipGapCommentary: "Leadership gap commentary is unavailable until completed responses are present.",
      varianceCommentary: "Variance commentary is unavailable until completed responses are present.",
      interventionTitle: "Required Intervention",
      interventionBody: "Complete the campaign and aggregate the responses before attempting interpretation.",
      advisoryCtaTitle: "Request Executive Diagnostic",
      advisoryCtaBody: "Once responses are complete, commission an executive readout to translate signal into intervention.",
    };
  }

  const weak = domainList(snapshot.weakestDomains);

  const executivePosture =
    snapshot.band === "aligned"
      ? "The institution is presently coherent. Direction is not merely stated but broadly shared."
      : snapshot.band === "drifting"
        ? "The institution still retains direction, but structural drift is visible across the operating environment."
        : snapshot.band === "misaligned"
          ? "The institution is expending effort without full coherence between mandate and lived operation."
          : "The institution is presently fragmented. Activity can no longer be trusted as a clean signal of strategic health.";

  const organisationalInterpretation =
    snapshot.band === "aligned"
      ? `The current campaign indicates broad organisational coherence. The key risk is quiet softening, especially in ${weak}.`
      : snapshot.band === "drifting"
        ? `The current campaign indicates a structure that still functions, but with visible weakening. Immediate attention should focus on ${weak}.`
        : snapshot.band === "misaligned"
          ? `The current campaign indicates that declared direction and actual operating pattern are no longer fully cooperating. The most urgent weaknesses are ${weak}.`
          : `The current campaign indicates that the organisation is operating in a fragmented state. Structural intervention should begin with ${weak}.`;

  const leadershipGapCommentary = gap
    ? gap.overallGapPercent >= 15
      ? "Leadership perception is materially different from the broader organisational signal. This suggests an interpretation gap that may conceal strategic blind spots."
      : "Leadership perception is broadly in line with the wider institutional signal."
    : "Leadership gap commentary is currently unavailable.";

  const highVarianceDomains = snapshot.varianceScores
    .filter((item) => item.variance >= 20)
    .map((item) => ENTERPRISE_ALIGNMENT_DOMAIN_LABELS[item.domain]);

  const varianceCommentary = highVarianceDomains.length
    ? `Response spread is materially high in ${highVarianceDomains.join(", ")}. This suggests internal incoherence rather than merely low performance.`
    : "Variance levels are currently within a relatively controlled range.";

  return {
    executivePosture,
    organisationalInterpretation,
    leadershipGapCommentary,
    varianceCommentary,
    interventionTitle: "Required Intervention",
    interventionBody:
      snapshot.band === "aligned"
        ? "Protect coherence, tighten weak domains early, and prevent drift from becoming cultural normal."
        : snapshot.band === "drifting"
          ? "Recalibrate the institution before drift becomes operating culture. Tighten priorities, reduce noise, and address the weakest domains explicitly."
          : snapshot.band === "misaligned"
            ? "Simplify, restate mandate, and repair the domains where direction and execution have separated."
            : "Do not optimise noise. Re-establish mandate, reduce complexity, and rebuild institutional order from the foundations.",
    advisoryCtaTitle: "Book Executive Diagnostic",
    advisoryCtaBody:
      "Commission an executive readout to translate this campaign into concrete intervention priorities, leadership discussion points, and institutional correction sequencing.",
  };
}