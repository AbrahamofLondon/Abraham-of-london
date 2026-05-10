/**
 * Instrument Pack Contract — defines pack composition and completion tracking.
 */

import type { InstrumentSlug } from "./governed-instrument-contract";

export type PackId =
  | "operator_essentials"
  | "command_pack"
  | "governance_suite"
  | "executive_intelligence";

export type InstrumentPack = {
  id: PackId;
  displayName: string;
  price: string;
  description: string;
  includedInstruments: InstrumentSlug[];
  buyerQuestion: string;
  dossierTitle: string;
};

export const INSTRUMENT_PACKS: Record<PackId, InstrumentPack> = {
  operator_essentials: {
    id: "operator_essentials",
    displayName: "Operator Essentials",
    price: "£129",
    description: "What is broken, and how exposed are we?",
    includedInstruments: [
      "decision-exposure-instrument",
      "escalation-readiness-scorecard",
      "structural-failure-diagnostic-canvas",
    ],
    buyerQuestion: "What is broken, and how exposed are we?",
    dossierTitle: "Operator Essentials Dossier",
  },
  command_pack: {
    id: "command_pack",
    displayName: "Command Pack",
    price: "£249",
    description: "What is broken, who should fix it, and where is alignment failing?",
    includedInstruments: [
      "decision-exposure-instrument",
      "escalation-readiness-scorecard",
      "structural-failure-diagnostic-canvas",
      "execution-risk-index",
      "mandate-clarity-framework",
      "team-alignment-gap-map",
    ],
    buyerQuestion: "What is broken, who should fix it, and where is alignment failing?",
    dossierTitle: "Command Pack Dossier",
  },
  governance_suite: {
    id: "governance_suite",
    displayName: "Governance Suite",
    price: "£495",
    description: "How do we govern this decision estate?",
    includedInstruments: [
      "decision-exposure-instrument",
      "escalation-readiness-scorecard",
      "structural-failure-diagnostic-canvas",
      "execution-risk-index",
      "team-alignment-gap-map",
      "mandate-clarity-framework",
      "governance-drift-detector",
      "strategic-priority-stack-builder",
      "intervention-path-selector",
      "board-brief-template",
    ],
    buyerQuestion: "How do we govern this decision estate?",
    dossierTitle: "Governance Suite Dossier",
  },
  executive_intelligence: {
    id: "executive_intelligence",
    displayName: "Executive Intelligence",
    price: "£995",
    description: "Full institutional decision intelligence with executive reporting and corridor entry.",
    includedInstruments: [
      "decision-exposure-instrument",
      "escalation-readiness-scorecard",
      "structural-failure-diagnostic-canvas",
      "execution-risk-index",
      "team-alignment-gap-map",
      "mandate-clarity-framework",
      "governance-drift-detector",
      "strategic-priority-stack-builder",
      "intervention-path-selector",
      "board-brief-template",
    ],
    buyerQuestion: "Give me the full picture before this becomes expensive.",
    dossierTitle: "Executive Intelligence Dossier",
  },
};

export type PackCompletionStatus = {
  packId: PackId;
  completed: InstrumentSlug[];
  remaining: InstrumentSlug[];
  completionRate: number;
  dossierEligible: boolean;
  earnedEscalation: string | null;
};

/**
 * Compute pack completion status from a list of completed instrument slugs.
 */
export function computePackCompletion(
  packId: PackId,
  completedSlugs: InstrumentSlug[],
): PackCompletionStatus {
  const pack = INSTRUMENT_PACKS[packId];
  const completed = pack.includedInstruments.filter((s) => completedSlugs.includes(s));
  const remaining = pack.includedInstruments.filter((s) => !completedSlugs.includes(s));
  const completionRate = Math.round((completed.length / pack.includedInstruments.length) * 100);
  const dossierEligible = completionRate === 100;

  let earnedEscalation: string | null = null;
  if (dossierEligible) {
    if (packId === "executive_intelligence" || packId === "governance_suite") {
      earnedEscalation = "Executive Reporting and Strategy Room entry are now admissible.";
    } else if (packId === "command_pack") {
      earnedEscalation = "Executive Reporting is now admissible based on pack completion.";
    } else {
      earnedEscalation = "Escalation Readiness assessment is recommended as next step.";
    }
  }

  return { packId, completed, remaining, completionRate, dossierEligible, earnedEscalation };
}
