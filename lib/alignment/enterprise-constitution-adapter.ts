// lib/alignment/enterprise-constitution-adapter.ts
import { evaluateConstitutionalRoute } from "@/lib/constitution/rules";
import type {
  AuthorityType,
  ConstitutionalDecision,
  OrgPosture,
  ReadinessTier,
} from "@/lib/constitution/rules";
import type {
  EnterpriseAssessmentResult,
  EnterpriseAlignmentDomain,
  EnterpriseDomainScore,
} from "@/lib/alignment/enterprise-types";

export type EnterpriseMarketReadiness =
  | "FOUNDATIONAL"
  | "DEVELOPING"
  | "COMPETITIVE"
  | "INSTITUTIONAL";

export type EnterprisePrioritySignal =
  | "LOW"
  | "MATERIAL"
  | "HIGH"
  | "CRITICAL";

export type EnterpriseConstitutionalAdapterResult = {
  constitutionalInput: {
    clarityScore: number;
    authorityType: AuthorityType;
    readinessTier: ReadinessTier;
    posture: OrgPosture;
    failureModeCount: number;
    failureModeSeverity: number;
    narrativeCoherence: number;
    interventionReadiness: number;
    mandateFit: boolean;
    seriousnessScore: number;
    operatorOverrideRequested: boolean;
    trustCondition: number;
    governanceDiscipline: number;
  };
  constitutionalDecision: ConstitutionalDecision;
  derived: {
    marketReadiness: EnterpriseMarketReadiness;
    prioritySignal: EnterprisePrioritySignal;
    trustCondition: number;
    governanceDiscipline: number;
    coherenceScore: number;
    strongestDomains: EnterpriseAlignmentDomain[];
    weakestDomains: EnterpriseAlignmentDomain[];
    failureModes: string[];
    requiredInterventions: string[];
    executiveSummary: string;
  };
};

type AdapterOptions = {
  authorityType?: AuthorityType;
  mandateFit?: boolean;
  seriousnessScore?: number;
  operatorOverrideRequested?: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(value), min), max);
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function findDomainPercent(
  domainScores: EnterpriseDomainScore[],
  domain: EnterpriseAlignmentDomain,
  fallback = 50,
): number {
  const found = domainScores.find((item) => item.domain === domain);
  return found ? found.percent : fallback;
}

function mapBandToPosture(
  band: EnterpriseAssessmentResult["band"],
): OrgPosture {
  switch (band) {
    case "ALIGNED":
      return "ORDERED";
    case "DRIFTING":
      return "DRIFTING";
    case "MISALIGNED":
      return "MISALIGNED";
    case "DISORDERED":
    default:
      return "DISORDERED";
  }
}

function deriveAuthorityType(
  result: EnterpriseAssessmentResult,
  override?: AuthorityType,
): AuthorityType {
  if (override) return override;
  if (result.percentScore >= 78) return "DIRECT";
  if (result.percentScore >= 52) return "PROXY";
  return "UNCLEAR";
}

function deriveReadinessTier(
  result: EnterpriseAssessmentResult,
): ReadinessTier {
  switch (result.band) {
    case "ALIGNED":
      return result.percentScore >= 92 ? "SOVEREIGN" : "EXECUTION_READY";
    case "DRIFTING":
      return "STABILIZING";
    case "MISALIGNED":
      return "EMERGING";
    case "DISORDERED":
    default:
      return "FRAGILE";
  }
}

function deriveGovernanceDiscipline(
  domainScores: EnterpriseDomainScore[],
): number {
  return clamp(
    average([
      findDomainPercent(domainScores, "mandate_clarity"),
      findDomainPercent(domainScores, "decision_integrity"),
      findDomainPercent(domainScores, "operational_discipline"),
    ]),
    0,
    100,
  );
}

function deriveTrustCondition(
  domainScores: EnterpriseDomainScore[],
): number {
  return clamp(
    average([
      findDomainPercent(domainScores, "environmental_coherence"),
      findDomainPercent(domainScores, "emotional_cultural_order"),
      findDomainPercent(domainScores, "legacy_continuity_orientation"),
    ]),
    0,
    100,
  );
}

function deriveNarrativeCoherence(
  domainScores: EnterpriseDomainScore[],
  percentScore: number,
): number {
  return clamp(
    average([
      findDomainPercent(domainScores, "mandate_clarity"),
      findDomainPercent(domainScores, "decision_integrity"),
      findDomainPercent(domainScores, "legacy_continuity_orientation"),
      percentScore,
    ]),
    0,
    100,
  );
}

function deriveInterventionReadiness(
  percentScore: number,
  governanceDiscipline: number,
  trustCondition: number,
): number {
  return clamp(
    percentScore * 0.45 +
      governanceDiscipline * 0.3 +
      trustCondition * 0.25,
    0,
    100,
  );
}

function deriveFailureModeCount(
  weakestDomains: EnterpriseAlignmentDomain[],
  domainScores: EnterpriseDomainScore[],
): number {
  const weakUnder45 = domainScores.filter((item) => item.percent < 45).length;
  return clamp(Math.max(weakestDomains.length, weakUnder45), 0, 10);
}

function deriveFailureModeSeverity(
  domainScores: EnterpriseDomainScore[],
): number {
  const lowest = domainScores.length
    ? Math.min(...domainScores.map((item) => item.percent))
    : 50;

  return clamp((100 - lowest) / 10, 0, 10);
}

function mapWeakDomainToFailureMode(domain: EnterpriseAlignmentDomain): string {
  switch (domain) {
    case "mandate_clarity":
      return "Narrative incoherence";
    case "decision_integrity":
      return "Decision-rights ambiguity";
    case "environmental_coherence":
      return "Systemic structural disorder";
    case "operational_discipline":
      return "Operating cadence decay";
    case "emotional_cultural_order":
      return "Trust erosion";
    case "legacy_continuity_orientation":
      return "Strategic-operational misalignment";
    default:
      return "Systemic structural disorder";
  }
}

function mapWeakDomainToIntervention(domain: EnterpriseAlignmentDomain): string {
  switch (domain) {
    case "mandate_clarity":
      return "Re-sequence strategic priorities";
    case "decision_integrity":
      return "Clarify decision owner and sponsor";
    case "environmental_coherence":
      return "Stabilize operating environment";
    case "operational_discipline":
      return "Tighten operating cadence";
    case "emotional_cultural_order":
      return "Restore governance discipline";
    case "legacy_continuity_orientation":
      return "Adjust decision horizon for external volatility";
    default:
      return "Run guided diagnostic before escalation";
  }
}

function deriveMarketReadiness(
  route: ConstitutionalDecision["route"],
  percentScore: number,
): EnterpriseMarketReadiness {
  if (route === "STRATEGY" && percentScore >= 85) return "INSTITUTIONAL";
  if (route === "STRATEGY" || percentScore >= 65) return "COMPETITIVE";
  if (route === "DIAGNOSTIC" || percentScore >= 45) return "DEVELOPING";
  return "FOUNDATIONAL";
}

function derivePrioritySignal(
  route: ConstitutionalDecision["route"],
  failureModeSeverity: number,
  percentScore: number,
): EnterprisePrioritySignal {
  if (route === "REJECT" && failureModeSeverity >= 8) return "CRITICAL";
  if (route === "DIAGNOSTIC" && failureModeSeverity >= 6) return "HIGH";
  if (route === "STRATEGY" || percentScore >= 60) return "MATERIAL";
  return "LOW";
}

function buildExecutiveSummary(args: {
  route: ConstitutionalDecision["route"];
  band: EnterpriseAssessmentResult["band"];
  percentScore: number;
  weakestDomains: EnterpriseAlignmentDomain[];
}): string {
  const weakest = args.weakestDomains.join(", ");

  switch (args.route) {
    case "STRATEGY":
      return `Enterprise posture is ${args.band.toLowerCase()} at ${args.percentScore}%. The organisation is fit for strategic escalation, with principal watchpoints in ${weakest || "secondary domains"}.`;
    case "DIAGNOSTIC":
      return `Enterprise posture is ${args.band.toLowerCase()} at ${args.percentScore}%. The signal is credible, but corrective work should come before escalation, especially across ${weakest || "weak domains"}.`;
    case "REJECT":
    default:
      return `Enterprise posture is ${args.band.toLowerCase()} at ${args.percentScore}%. Foundational repair is required before escalation, with the sharpest deficits concentrated in ${weakest || "core domains"}.`;
  }
}

export function adaptEnterpriseAssessmentToConstitution(
  result: EnterpriseAssessmentResult,
  options: AdapterOptions = {},
): EnterpriseConstitutionalAdapterResult {
  const authorityType = deriveAuthorityType(result, options.authorityType);
  const readinessTier = deriveReadinessTier(result);
  const posture = mapBandToPosture(result.band);

  const governanceDiscipline = deriveGovernanceDiscipline(result.domainScores);
  const trustCondition = deriveTrustCondition(result.domainScores);
  const coherenceScore = deriveNarrativeCoherence(
    result.domainScores,
    result.percentScore,
  );
  const interventionReadiness = deriveInterventionReadiness(
    result.percentScore,
    governanceDiscipline,
    trustCondition,
  );

  const failureModeCount = deriveFailureModeCount(
    result.weakestDomains,
    result.domainScores,
  );
  const failureModeSeverity = deriveFailureModeSeverity(result.domainScores);

  const seriousnessScore = clamp(
    options.seriousnessScore ??
      Math.round((result.percentScore + coherenceScore) / 2),
    0,
    100,
  );

  const constitutionalInput = {
    clarityScore: clamp(
      result.percentScore * 0.55 + coherenceScore * 0.45,
      0,
      100,
    ),
    authorityType,
    readinessTier,
    posture,
    failureModeCount,
    failureModeSeverity,
    narrativeCoherence: coherenceScore,
    interventionReadiness,
    mandateFit: options.mandateFit ?? true,
    seriousnessScore,
    operatorOverrideRequested: options.operatorOverrideRequested ?? false,
    trustCondition,
    governanceDiscipline,
  };

  const constitutionalDecision = evaluateConstitutionalRoute(constitutionalInput);

  const failureModes = Array.from(
    new Set(result.weakestDomains.map(mapWeakDomainToFailureMode)),
  );

  const requiredInterventions = Array.from(
    new Set([
      ...result.weakestDomains.map(mapWeakDomainToIntervention),
      ...constitutionalDecision.recommendedInterventions,
    ]),
  );

  return {
    constitutionalInput,
    constitutionalDecision,
    derived: {
      marketReadiness: deriveMarketReadiness(
        constitutionalDecision.route,
        result.percentScore,
      ),
      prioritySignal: derivePrioritySignal(
        constitutionalDecision.route,
        failureModeSeverity,
        result.percentScore,
      ),
      trustCondition,
      governanceDiscipline,
      coherenceScore,
      strongestDomains: result.strongestDomains,
      weakestDomains: result.weakestDomains,
      failureModes,
      requiredInterventions,
      executiveSummary: buildExecutiveSummary({
        route: constitutionalDecision.route,
        band: result.band,
        percentScore: result.percentScore,
        weakestDomains: result.weakestDomains,
      }),
    },
  };
}