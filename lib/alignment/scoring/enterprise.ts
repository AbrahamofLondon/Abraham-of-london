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
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function findDomainPercent(
  domainScores: EnterpriseDomainScore[],
  domain: string,
  fallback = 50,
): number {
  const found = domainScores.find((item) => String(item.domain) === domain);
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

  const percent = result.percentScore;

  if (percent >= 78) return "DIRECT";
  if (percent >= 52) return "PROXY";
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
  const governance = findDomainPercent(domainScores, "GOVERNANCE");
  const board = findDomainPercent(domainScores, "BOARD");
  const decisionQuality = findDomainPercent(domainScores, "DECISION_QUALITY");
  const operatingCadence = findDomainPercent(domainScores, "OPERATING_CADENCE");

  return clamp(
    average([governance, board, decisionQuality, operatingCadence]),
    0,
    100,
  );
}

function deriveTrustCondition(
  domainScores: EnterpriseDomainScore[],
): number {
  const trust = findDomainPercent(domainScores, "TRUST");
  const leadershipTrust = findDomainPercent(domainScores, "LEADERSHIP_TRUST");
  const culturalCohesion = findDomainPercent(domainScores, "CULTURAL_COHESION");
  const alignment = findDomainPercent(domainScores, "ALIGNMENT");

  return clamp(
    average([trust, leadershipTrust, culturalCohesion, alignment]),
    0,
    100,
  );
}

function deriveNarrativeCoherence(
  domainScores: EnterpriseDomainScore[],
  percentScore: number,
): number {
  const strategicIntent = findDomainPercent(domainScores, "STRATEGIC_INTENT");
  const operationalClarity = findDomainPercent(domainScores, "OPERATIONAL_CLARITY");
  const alignment = findDomainPercent(domainScores, "ALIGNMENT");

  return clamp(
    average([strategicIntent, operationalClarity, alignment, percentScore]),
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
    Math.round(
      percentScore * 0.45 +
        governanceDiscipline * 0.3 +
        trustCondition * 0.25,
    ),
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

  return clamp(Math.round((100 - lowest) / 10), 0, 10);
}

function mapWeakDomainToFailureMode(domain: EnterpriseAlignmentDomain): string {
  switch (String(domain)) {
    case "STRATEGIC_INTENT":
      return "Narrative incoherence";
    case "OPERATIONAL_CLARITY":
      return "Strategic-operational misalignment";
    case "LEADERSHIP_TRUST":
      return "Trust erosion";
    case "CULTURAL_COHESION":
      return "Execution inconsistency";
    case "EXECUTION":
      return "Execution fragility";
    case "GOVERNANCE":
      return "Governance breakdown";
    case "ALIGNMENT":
      return "Systemic structural disorder";
    case "BOARD":
      return "Decision-rights ambiguity";
    case "OPERATING_CADENCE":
      return "Operating cadence decay";
    case "DECISION_QUALITY":
      return "Capital allocation distortion";
    case "TRUST":
      return "Trust erosion";
    default:
      return "Systemic structural disorder";
  }
}

function mapWeakDomainToIntervention(domain: EnterpriseAlignmentDomain): string {
  switch (String(domain)) {
    case "STRATEGIC_INTENT":
      return "Re-sequence strategic priorities";
    case "OPERATIONAL_CLARITY":
      return "Run guided diagnostic before escalation";
    case "LEADERSHIP_TRUST":
      return "Restore governance discipline";
    case "CULTURAL_COHESION":
      return "Reduce execution strain before transformation load";
    case "EXECUTION":
      return "Tighten operating cadence";
    case "GOVERNANCE":
      return "Clarify decision owner and sponsor";
    case "ALIGNMENT":
      return "Run guided diagnostic before escalation";
    case "BOARD":
      return "Clarify decision owner and sponsor";
    case "OPERATING_CADENCE":
      return "Tighten operating cadence";
    case "DECISION_QUALITY":
      return "Adjust decision horizon for external volatility";
    case "TRUST":
      return "Restore governance discipline";
    default:
      return "Protect advisory bandwidth";
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
  const weakest = args.weakestDomains.map(String).join(", ");

  switch (args.route) {
    case "STRATEGY":
      return `Enterprise posture is ${args.band.toLowerCase()} at ${args.percentScore}%. The case is fit for strategic escalation, with the main watchpoints concentrated in ${weakest || "secondary domains"}.`;
    case "DIAGNOSTIC":
      return `Enterprise posture is ${args.band.toLowerCase()} at ${args.percentScore}%. The signal is credible, but corrective work is required before escalation, especially across ${weakest || "weak domains"}.`;
    case "REJECT":
    default:
      return `Enterprise posture is ${args.band.toLowerCase()} at ${args.percentScore}%. Foundational repair is required before escalation, with the sharpest deficits concentrated in ${weakest || "core operating domains"}.`;
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
    options.seriousnessScore ?? Math.round((result.percentScore + coherenceScore) / 2),
    0,
    100,
  );

  const constitutionalInput = {
    clarityScore: clamp(
      Math.round(result.percentScore * 0.55 + coherenceScore * 0.45),
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