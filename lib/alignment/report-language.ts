import { ALIGNMENT_DOMAIN_LABELS } from "./checklist";
import type {
  AlignmentAssessmentResult,
  AlignmentBand,
  AlignmentDomain,
  PurposeProfileResult,
  StoredPurposeAlignmentAssessment,
} from "./types";

type AssessmentLike = Pick<
  StoredPurposeAlignmentAssessment,
  "band" | "weakestDomains" | "domainScores"
> & {
  canonicalResult?: PurposeProfileResult | null;
};

export type AlignmentNarrativeBundle = {
  posture: string;
  executiveSummary: string;
  bandInterpretationTitle: string;
  bandInterpretationBody: string;
  correctivePriorityTitle: string;
  correctivePriorityBody: string;
  strongestSignalTitle: string;
  strongestSignalBody: string;
  dashboardSummary: string;
  ctaTitle: string;
  ctaBody: string;
  reportClosingNote: string;
  reminderPrompt: string;
};

function domainLabel(domain: AlignmentDomain): string {
  return ALIGNMENT_DOMAIN_LABELS[domain];
}

function domainList(domains: AlignmentDomain[]): string {
  if (domains.length === 0) return "no major weakness";
  if (domains.length === 1) return domainLabel(domains[0]!);
  if (domains.length === 2) return `${domainLabel(domains[0]!)} and ${domainLabel(domains[1]!)}`;
  const labels = domains.map(domainLabel);
  return `${labels.slice(0, -1).join(", ")}, and ${labels.at(-1)!}`;
}

function bestDomain(assessment: AssessmentLike): AlignmentDomain | null {
  if (!assessment.domainScores.length) return null;
  return [...assessment.domainScores].sort((a, b) => b.percent - a.percent)[0]?.domain ?? null;
}

function weakestDomain(assessment: AssessmentLike): AlignmentDomain | null {
  return assessment.weakestDomains[0] ?? null;
}

function postureByBand(band: AlignmentBand): string {
  switch (band) {
    case "aligned":
      return "Directional coherence is presently holding.";
    case "drifting":
      return "Core direction remains present, but structural drift is visible.";
    case "misaligned":
      return "Energy and direction are no longer operating in full coherence.";
    case "disordered":
      return "The present operating pattern reflects fragmentation rather than governed motion.";
    default:
      return "Assessment posture unavailable.";
  }
}

function executiveSummaryByBand(assessment: AssessmentLike): string {
  const weak = domainList(assessment.weakestDomains);

  switch (assessment.band) {
    case "aligned":
      return `The current assessment indicates strong directional integrity. Identity, decision logic, operating behaviour, and long-horizon posture are functioning with usable coherence. The immediate task is not reinvention but protection. Watch ${weak} carefully so present strength does not conceal the first signs of softening.`;
    case "drifting":
      return `The system still retains direction, but it is no longer carrying that direction with full firmness. This is not collapse, but it is no longer clean alignment either. The most visible points of weakness are ${weak}. Correction should focus on restoring disciplined continuity before drift becomes normalised.`;
    case "misaligned":
      return `The current reading suggests visible separation between stated direction and lived operating pattern. This often presents as fatigue, noise, and effort without clean compounding. The most vulnerable domains are ${weak}. Simplification and directional reset are now required.`;
    case "disordered":
      return `The present assessment indicates directional fragmentation. Activity may still be present, but it is no longer translating reliably into aligned outcomes. The weakest structural points are ${weak}. The correct response is not optimisation but intervention: reduce noise, re-establish mandate, and rebuild governed rhythm from first principles.`;
    default:
      return "Executive summary unavailable.";
  }
}

function bandInterpretation(
  band: AlignmentBand
): { title: string; body: string } {
  switch (band) {
    case "aligned":
      return {
        title: "Band Reading: Aligned",
        body: "The system is presently coherent. The risk at this stage is quiet drift, hidden softening, or complacency disguised as stability.",
      };
    case "drifting":
      return {
        title: "Band Reading: Drifting",
        body: "Direction still exists, but the structure is beginning to tolerate inconsistency. Left uncorrected, small deviations will harden into operating culture.",
      };
    case "misaligned":
      return {
        title: "Band Reading: Misaligned",
        body: "Effort and direction are no longer reinforcing one another. The subject is likely expending energy without receiving the full return of structured coherence.",
      };
    case "disordered":
      return {
        title: "Band Reading: Disordered",
        body: "The present pattern is no longer governed by clear directional integrity. Activity has become unreliable as a signal of meaningful progress.",
      };
    default:
      return {
        title: "Band Reading",
        body: "No band interpretation available.",
      };
  }
}

function correctivePriority(
  assessment: AssessmentLike
): { title: string; body: string } {
  const weakest = weakestDomain(assessment);
  if (!weakest) {
    return {
      title: "Primary Correction",
      body: "No primary correction is currently available.",
    };
  }

  const map: Record<AlignmentDomain, string> = {
    identity:
      "Rewrite the mandate with ruthless clarity. If direction cannot be stated plainly, it cannot govern behaviour consistently.",
    decision:
      "Audit recent major decisions and identify where urgency, pressure, or mood displaced principle.",
    environment:
      "Remove one recurring source of confusion, dilution, or sabotage from the operating environment immediately.",
    behaviour:
      "Rebuild calendar logic and daily rhythm around one output-bearing non-negotiable habit.",
    emotional_order:
      "Stabilise internal order before expanding activity. A dysregulated operator cannot sustain coherent execution.",
    legacy:
      "Define the structure being built that must outlast the current season, then begin acting in service of it.",
  };

  return {
    title: `Primary Correction: ${domainLabel(weakest)}`,
    body: map[weakest],
  };
}

function strongestSignal(
  assessment: AssessmentLike
): { title: string; body: string } {
  const strongest = bestDomain(assessment);
  if (!strongest) {
    return {
      title: "Strongest Signal",
      body: "No strong signal is currently available.",
    };
  }

  const label = domainLabel(strongest);
  return {
    title: `Strongest Signal: ${label}`,
    body: `${label} is presently carrying the strongest structural signal in this assessment. This domain should be protected, because current strength often becomes the platform from which broader recovery is possible.`,
  };
}

function dashboardSummary(assessment: AssessmentLike): string {
  const weak = domainList(assessment.weakestDomains);

  switch (assessment.band) {
    case "aligned":
      return `The system is presently coherent. Guard against softening in ${weak}.`;
    case "drifting":
      return `Direction is still present, but drift is visible. Priority attention should go to ${weak}.`;
    case "misaligned":
      return `Direction and behaviour are no longer fully coherent. Reset should begin with ${weak}.`;
    case "disordered":
      return `The system is fragmented. Intervention should begin with ${weak}.`;
    default:
      return "No dashboard summary available.";
  }
}

function callToAction(
  assessment: AssessmentLike
): { title: string; body: string } {
  switch (assessment.band) {
    case "aligned":
      return {
        title: "Recommended Action",
        body: "Maintain monthly review cadence, protect current strengths, and intervene early where drift first appears.",
      };
    case "drifting":
      return {
        title: "Recommended Action",
        body: "Recalibrate within the next 7 days. Remove one source of noise, tighten one weak domain, and reassess before drift becomes culture.",
      };
    case "misaligned":
      return {
        title: "Recommended Action",
        body: "Initiate an immediate reset. Reduce non-essential activity, restate the mandate, and rebuild governed rhythm around one stabilising structure.",
      };
    case "disordered":
      return {
        title: "Recommended Action",
        body: "Do not attempt optimisation. Reduce complexity, restore order, and rebuild the system from foundational direction rather than surface productivity.",
      };
    default:
      return {
        title: "Recommended Action",
        body: "No action guidance available.",
      };
  }
}

function reportClosingNote(band: AlignmentBand): string {
  switch (band) {
    case "aligned":
      return "This report should be read as a protection brief: maintain coherence, detect drift early, and defend the structure already working.";
    case "drifting":
      return "This report should be read as an early-warning brief: the structure remains viable, but indiscipline is beginning to erode clarity.";
    case "misaligned":
      return "This report should be read as a correction brief: the present pattern is no longer producing clean directional integrity.";
    case "disordered":
      return "This report should be read as an intervention brief: structural order must be restored before meaningful acceleration can occur.";
    default:
      return "This report records directional integrity at a point in time.";
  }
}

function reminderPrompt(assessment: AssessmentLike): string {
  switch (assessment.band) {
    case "aligned":
      return "Your last assessment indicated healthy alignment. Review again this month to ensure current coherence is not hiding fresh drift.";
    case "drifting":
      return "Your last assessment indicated drift. Reassess this month to confirm whether correction has restored directional firmness.";
    case "misaligned":
      return "Your last assessment indicated misalignment. Reassess now to determine whether the reset has begun to restore coherence.";
    case "disordered":
      return "Your last assessment indicated disorder. Reassess this month only after foundational intervention has begun.";
    default:
      return "A new alignment assessment is due.";
  }
}

export function buildAlignmentNarrative(
  assessment: AssessmentLike
): AlignmentNarrativeBundle {
  const canonicalResult = assessment.canonicalResult;
  if (canonicalResult?.reportNarrative && canonicalResult.primaryPattern) {
    const result = canonicalResult;
    const primaryPattern = result.primaryPattern!;
    const narrative = result.reportNarrative!;
    return {
      posture: narrative.conditionStatement,
      executiveSummary: [
        narrative.classificationExplanation,
        narrative.contradictionExplanation,
        narrative.consequenceBlock,
      ].join(" "),
      bandInterpretationTitle: `Condition: ${primaryPattern.label}`,
      bandInterpretationBody: narrative.classificationExplanation,
      correctivePriorityTitle: "First Action",
      correctivePriorityBody: narrative.firstActionBlock,
      strongestSignalTitle: result.evidence?.strongestStabilisingSignal
        ? `Strongest Signal: ${domainLabel(result.evidence.strongestStabilisingSignal.domain)}`
        : "Strongest Signal",
      strongestSignalBody: result.evidence?.strongestStabilisingSignal
        ? `"${result.evidence.strongestStabilisingSignal.statement}" scored ${result.evidence.strongestStabilisingSignal.resonance}/10 resonance with ${result.evidence.strongestStabilisingSignal.certainty}/10 certainty.`
        : "No stabilising signal was isolated.",
      dashboardSummary: `${primaryPattern.label}: ${narrative.consequenceBlock}`,
      ctaTitle: result.routingRecommendation?.label ?? "Recommended Action",
      ctaBody: narrative.nextStepBlock,
      reportClosingNote: narrative.nextStepBlock,
      reminderPrompt: `Reassess after completing the first action for ${primaryPattern.label}.`,
    };
  }

  const bandRead = bandInterpretation(assessment.band);
  const corrective = correctivePriority(assessment);
  const strongest = strongestSignal(assessment);
  const cta = callToAction(assessment);

  return {
    posture: postureByBand(assessment.band),
    executiveSummary: executiveSummaryByBand(assessment),
    bandInterpretationTitle: bandRead.title,
    bandInterpretationBody: bandRead.body,
    correctivePriorityTitle: corrective.title,
    correctivePriorityBody: corrective.body,
    strongestSignalTitle: strongest.title,
    strongestSignalBody: strongest.body,
    dashboardSummary: dashboardSummary(assessment),
    ctaTitle: cta.title,
    ctaBody: cta.body,
    reportClosingNote: reportClosingNote(assessment.band),
    reminderPrompt: reminderPrompt(assessment),
  };
}

export function buildAlignmentNarrativeFromResult(
  result: AlignmentAssessmentResult | PurposeProfileResult
): AlignmentNarrativeBundle {
  if ("coherenceBand" in result) {
    return buildAlignmentNarrative({
      band:
        result.coherenceBand === "SOVEREIGN" || result.coherenceBand === "ALIGNED"
          ? "aligned"
          : result.coherenceBand === "DRIFTING"
            ? "drifting"
            : "disordered",
      weakestDomains: result.weakestDomains,
      domainScores: result.domainProfiles.map((domain) => ({
        domain: domain.domain,
        earned: domain.weighted,
        possible: 10,
        percent: domain.percent,
      })),
      canonicalResult: result,
    });
  }

  return buildAlignmentNarrative(result);
}
