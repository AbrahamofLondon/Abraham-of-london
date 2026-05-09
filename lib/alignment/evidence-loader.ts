/**
 * lib/alignment/evidence-loader.ts — Purpose Alignment evidence loader.
 *
 * Loads persisted Purpose Alignment evidence from the DiagnosticJourney store
 * for downstream consumption. This is the canonical retrieval path.
 *
 * The governing standard:
 *   CAPTURED is not enough.
 *   PERSISTED is not enough.
 *   AVAILABLE is not enough.
 *   A field is only repaired when it is captured, sent, persisted, retrieved,
 *   interpreted, surfaced where relevant, and labelled with its source.
 */

import { getDiagnosticJourney } from "@/lib/diagnostics/journey-store";
import type { PurposeProfileResult, AlignmentDomain } from "@/lib/alignment/types";
import type { GovernedMemoryItem } from "@/lib/product/governed-memory-contract";
import { normalisePurposeAlignmentEvidence } from "@/lib/product/field-provenance-normaliser";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — Public contract for downstream consumption
// ─────────────────────────────────────────────────────────────────────────────

export type PurposeAlignmentEvidenceCarryForward = {
  /** Whether PA evidence is available */
  available: boolean;
  /** Source surface identifier */
  sourceSurface: "PURPOSE_ALIGNMENT";
  /** When the assessment was created */
  assessedAt: string | null;
  /** Schema/scoring version */
  schemaVersion: string | null;
  /** Coherence band / profile */
  profile: string | null;
  /** Composite percentage score */
  compositeScore: number | null;
  /** Strongest domain */
  strongestDomain: string | null;
  /** Weakest domain */
  weakestDomain: string | null;
  /** Previously reported competing obligation */
  competingObligation: string | null;
  /** Previously reported consequence */
  consequence: string | null;
  /** Institutional consequence */
  institutionalConsequence: string | null;
  /** Primary pattern label */
  primaryPattern: string | null;
  /** Pattern consequence description */
  patternConsequence: string | null;
  /** Contradiction evidence (summarised, safe) */
  contradictions: Array<{
    type: string;
    severity: string;
    evidence: string;
  }>;
  /** Domain scores summary */
  domainScores: Array<{
    domain: string;
    label: string;
    percent: number;
  }>;
  /** First action / directive */
  firstAction: string | null;
  /** Corrections list */
  corrections: string[];
  /** Assessment ID for cross-reference */
  assessmentId: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// LOADER
// ─────────────────────────────────────────────────────────────────────────────

export async function loadPurposeAlignmentEvidence(input: {
  email?: string | null;
  subjectId?: string | null;
  campaignId?: string | null;
}): Promise<PurposeAlignmentEvidenceCarryForward> {
  const empty: PurposeAlignmentEvidenceCarryForward = {
    available: false,
    sourceSurface: "PURPOSE_ALIGNMENT",
    assessedAt: null,
    schemaVersion: null,
    profile: null,
    compositeScore: null,
    strongestDomain: null,
    weakestDomain: null,
    competingObligation: null,
    consequence: null,
    institutionalConsequence: null,
    primaryPattern: null,
    patternConsequence: null,
    contradictions: [],
    domainScores: [],
    firstAction: null,
    corrections: [],
    assessmentId: null,
  };

  try {
    const journey = await getDiagnosticJourney({
      email: input.email ?? undefined,
      subjectId: input.subjectId ?? undefined,
      campaignId: input.campaignId ?? undefined,
    });

    const paStage = journey.stages["purpose_alignment"] as Record<string, unknown> | undefined;
    if (!paStage) return empty;

    const payload = (paStage.payload ?? paStage) as Record<string, unknown>;

    const context = (payload.context ?? {}) as Record<string, unknown>;
    const resultSummary = (payload.resultSummary ?? {}) as Record<string, unknown>;
    const contradictions = (payload.contradictions ?? []) as Array<{
      type: string;
      severity: string;
      evidence: string;
    }>;
    const domainScores = (payload.domainScores ?? []) as Array<{
      domain: string;
      label: string;
      percent: number;
    }>;
    const primaryPattern = (payload.primaryPattern ?? null) as Record<string, unknown> | null;

    return {
      available: true,
      sourceSurface: "PURPOSE_ALIGNMENT",
      assessedAt: (payload.createdAt as string) ?? null,
      schemaVersion: (payload.schemaVersion as string) ?? null,
      profile: (payload.profile as string) ?? null,
      compositeScore: (payload.compositeScore as number) ?? null,
      strongestDomain: (payload.strongestDomain as string) ?? null,
      weakestDomain: (payload.weakestDomain as string) ?? null,
      competingObligation: (context.competingObligation as string) ?? null,
      consequence: (context.consequence as string) ?? null,
      institutionalConsequence: (context.institutionalConsequence as string) ?? null,
      primaryPattern: primaryPattern?.label as string ?? null,
      patternConsequence: primaryPattern?.consequence as string ?? null,
      contradictions: contradictions.map((c) => ({
        type: c.type,
        severity: c.severity,
        evidence: c.evidence,
      })),
      domainScores: domainScores.map((d) => ({
        domain: d.domain,
        label: d.label,
        percent: d.percent,
      })),
      firstAction: (payload.firstAction as string) ?? (resultSummary.firstActionBlock as string) ?? null,
      corrections: (resultSummary.corrections as string[]) ?? [],
      assessmentId: (payload.assessmentId as string) ?? null,
    };
  } catch {
    return empty;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSUMPTION HELPERS — labelled, source-attributed blocks for each surface
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a restrained "Purpose Alignment evidence carried forward" block
 * for Executive Reporting surfaces.
 */
export function buildExecutiveReportingPaBlock(
  evidence: PurposeAlignmentEvidenceCarryForward,
): Record<string, unknown> | null {
  if (!evidence.available) return null;

  const block: Record<string, unknown> = {
    source: "PURPOSE_ALIGNMENT",
    assessedAt: evidence.assessedAt,
    profile: evidence.profile,
    compositeScore: evidence.compositeScore,
  };

  if (evidence.competingObligation) {
    block["previouslyReportedCompetingObligation"] = evidence.competingObligation;
  }
  if (evidence.consequence) {
    block["previouslyReportedConsequence"] = evidence.consequence;
  }
  if (evidence.primaryPattern) {
    block["earlierAlignmentSignal"] = `${evidence.primaryPattern}${evidence.patternConsequence ? `: ${evidence.patternConsequence}` : ""}`;
  }
  if (evidence.weakestDomain) {
    block["weakestDomain"] = evidence.weakestDomain;
  }
  if (evidence.firstAction) {
    block["carriedForwardDirective"] = evidence.firstAction;
  }

  return block;
}

/**
 * Build Strategy Room execution memory from PA evidence.
 * Carries competingObligation and consequence into execution memory
 * to shape constraints and readiness. Does not duplicate large generic blocks.
 */
export function buildStrategyRoomPaMemory(
  evidence: PurposeAlignmentEvidenceCarryForward,
): Record<string, unknown> | null {
  if (!evidence.available) return null;

  return {
    source: "PURPOSE_ALIGNMENT",
    assessedAt: evidence.assessedAt,
    competingObligation: evidence.competingObligation,
    consequence: evidence.consequence,
    weakestDomain: evidence.weakestDomain,
    primaryPattern: evidence.primaryPattern,
    firstAction: evidence.firstAction,
  };
}

/**
 * Build Return Brief PA evidence section.
 * Only includes PA evidence if it shaped the case.
 */
export function buildReturnBriefPaSection(
  evidence: PurposeAlignmentEvidenceCarryForward,
): Record<string, unknown> | null {
  if (!evidence.available) return null;

  return {
    source: "PURPOSE_ALIGNMENT",
    assessedAt: evidence.assessedAt,
    previouslyReportedConsequence: evidence.consequence,
    previouslyReportedCompetingObligation: evidence.competingObligation,
    currentStateAgainstPriorConsequence: evidence.patternConsequence ?? evidence.consequence,
    profile: evidence.profile,
    weakestDomain: evidence.weakestDomain,
  };
}

/**
 * Build Decision Centre compact PA case memory.
 */
export function buildDecisionCentrePaMemory(
  evidence: PurposeAlignmentEvidenceCarryForward,
): Record<string, unknown> | null {
  if (!evidence.available) return null;

  return {
    source: "PURPOSE_ALIGNMENT",
    assessedAt: evidence.assessedAt,
    reportedCompetingObligation: evidence.competingObligation,
    reportedConsequence: evidence.consequence,
    weakestDomain: evidence.weakestDomain,
    date: evidence.assessedAt,
  };
}

/**
 * Build Oversight Brief / Control Room PA evidence aggregate.
 * Never exposes raw text. Only safe, summarised signals.
 */
export function buildOversightBriefPaAggregate(
  evidence: PurposeAlignmentEvidenceCarryForward,
): Record<string, unknown> | null {
  if (!evidence.available) return null;

  return {
    source: "PURPOSE_ALIGNMENT",
    assessedAt: evidence.assessedAt,
    profile: evidence.profile,
    compositeScore: evidence.compositeScore,
    weakestDomain: evidence.weakestDomain,
    contradictionCount: evidence.contradictions.length,
    patternLabel: evidence.primaryPattern,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GOVERNED MEMORY CONVERTER — renders PA evidence via GovernanceEvidenceCarryForward
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts Purpose Alignment evidence into GovernedMemoryItem[] for rendering
 * via the existing GovernanceEvidenceCarryForward component.
 *
 * Each field becomes a labelled, source-attributed, date-stamped memory item.
 */
export function convertPurposeAlignmentToGovernedMemory(
  evidence: PurposeAlignmentEvidenceCarryForward,
): GovernedMemoryItem[] {
  if (!evidence.available) return [];

  const items: GovernedMemoryItem[] = [];
  const provenance = normalisePurposeAlignmentEvidence(evidence);
  const base = {
    sourceSurface: "PURPOSE_ALIGNMENT" as const,
    capturedAt: evidence.assessedAt,
    evidenceOrigin: "STRUCTURED_DIAGNOSTIC" as const,
    audienceSafe: true,
  };

  // Profile / coherence band
  if (evidence.profile) {
    items.push({
      ...base,
      id: "pa_profile",
      label: "Earlier Purpose Alignment signal",
      summary: `Coherence band: ${evidence.profile}${evidence.compositeScore != null ? ` (${evidence.compositeScore}%)` : ""}`,
      status: "ACTIVE",
      confidenceLabel: "CAPTURED",
      provenance: provenance.filter((item) => item.fieldKey === "profile" || item.fieldKey === "compositeScore"),
    });
  }

  // Competing obligation
  if (evidence.competingObligation) {
    items.push({
      ...base,
      id: "pa_competing_obligation",
      label: "Previously reported competing obligation",
      summary: evidence.competingObligation,
      status: "ACTIVE",
      confidenceLabel: "REPORTED",
      provenance: provenance.filter((item) => item.fieldKey === "competingObligation"),
    });
  }

  // Consequence
  if (evidence.consequence) {
    items.push({
      ...base,
      id: "pa_consequence",
      label: "Previously reported consequence",
      summary: evidence.consequence,
      status: "UNRESOLVED",
      confidenceLabel: "REPORTED",
      provenance: provenance.filter((item) => item.fieldKey === "consequence"),
    });
  }

  // Primary pattern
  if (evidence.primaryPattern) {
    items.push({
      ...base,
      id: "pa_primary_pattern",
      label: "Earlier alignment signal",
      summary: `${evidence.primaryPattern}${evidence.patternConsequence ? `: ${evidence.patternConsequence}` : ""}`,
      status: "ACTIVE",
      confidenceLabel: "CAPTURED",
      provenance: provenance.filter((item) => item.fieldKey === "primaryPattern" || item.fieldKey === "patternConsequence"),
    });
  }

  // Weakest domain
  if (evidence.weakestDomain) {
    items.push({
      ...base,
      id: "pa_weakest_domain",
      label: "Weakest alignment domain",
      summary: `The weakest domain was ${evidence.weakestDomain}.`,
      status: "UNRESOLVED",
      confidenceLabel: "CAPTURED",
      provenance: provenance.filter((item) => item.fieldKey === "weakestDomain"),
    });
  }

  // Strongest domain
  if (evidence.strongestDomain) {
    items.push({
      ...base,
      id: "pa_strongest_domain",
      label: "Strongest alignment domain",
      summary: `The strongest domain was ${evidence.strongestDomain}.`,
      status: "ACTIVE",
      confidenceLabel: "CAPTURED",
      provenance: provenance.filter((item) => item.fieldKey === "strongestDomain"),
    });
  }

  // Contradictions (summarised, max 3)
  for (const [index, contradiction] of evidence.contradictions.slice(0, 3).entries()) {
    items.push({
      ...base,
      id: `pa_contradiction_${contradiction.type}`,
      label: "Detected contradiction",
      summary: contradiction.evidence,
      status: "UNRESOLVED",
      confidenceLabel: "CAPTURED",
      provenance: provenance.filter((item) => item.fieldKey === `contradictions.${index}`),
    });
  }

  // First action / directive
  if (evidence.firstAction) {
    items.push({
      ...base,
      id: "pa_first_action",
      label: "Carried-forward directive",
      summary: evidence.firstAction,
      status: "ACTIVE",
      confidenceLabel: "CAPTURED",
      provenance: provenance.filter((item) => item.fieldKey === "firstAction"),
    });
  }

  return items;
}
