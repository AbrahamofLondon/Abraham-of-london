import { readFileSync } from "node:fs";

import type {
  ControlledClaimDefinition,
  ControlledClaimId,
  TruthClaimClass,
  TruthClaimEvidenceState,
  TruthClaimHarnessState,
  TruthClaimOutcomeState,
  TruthClaimProvenanceState,
  TruthClaimRunState,
  TruthClaimSurface,
} from "@/lib/intelligence/claim-vocabulary-registry";
import {
  claimClassExceedsCeiling,
  CONTROLLED_TRUTH_CLAIMS,
  DEFAULT_SURFACE_CLASS_CEILINGS,
  getControlledTruthClaim,
  SUSPICIOUS_TRUTH_CLAIM_WARNINGS,
  type SuspiciousTruthClaimWarning,
} from "@/lib/intelligence/claim-vocabulary-registry";
import type { ProductIntelligenceClass } from "@/lib/intelligence/product-intelligence-classification";

export interface TruthClaimStateContext {
  productClass?: ProductIntelligenceClass | null;
  publicClaimAllowed?: boolean | null;
  evidenceState?: TruthClaimEvidenceState | null;
  runState?: TruthClaimRunState | null;
  harnessState?: TruthClaimHarnessState | null;
  provenanceState?: TruthClaimProvenanceState | null;
  outcomeState?: TruthClaimOutcomeState | null;
  judgementScore?: number | null;
  deliveryScore?: number | null;
  namesRejectedAlternatives?: boolean | null;
  weakEvidenceHandlingPassed?: boolean | null;
  benchmarkRecordPresent?: boolean | null;
}

export interface TruthClaimFirewallInput extends TruthClaimStateContext {
  claimId: ControlledClaimId;
  surface: TruthClaimSurface;
  classCeiling?: TruthClaimClass;
}

export interface TruthClaimFirewallDecision {
  claimId: ControlledClaimId;
  claimLabel: string;
  claimClass: TruthClaimClass;
  surface: TruthClaimSurface;
  classCeiling: TruthClaimClass;
  decision: "allowed" | "blocked";
  blockers: string[];
}

export interface ControlledClaimScanMatch {
  claimId: ControlledClaimId;
  claimLabel: string;
  claimClass: TruthClaimClass;
  matchedText: string;
  surface: TruthClaimSurface;
  line: number;
  column: number;
  context: string;
  boundedByContext: boolean;
}

export interface SuspiciousClaimScanMatch {
  label: string;
  matchedText: string;
  surface: TruthClaimSurface;
  line: number;
  column: number;
  context: string;
}

export interface TruthClaimFinding extends ControlledClaimScanMatch {
  source?: string;
  decision: "allowed" | "blocked" | "bounded";
  blockers: string[];
}

export interface SuspiciousTruthClaimFinding extends SuspiciousClaimScanMatch {
  source?: string;
  note: string;
}

export interface TruthClaimInspectionInput extends TruthClaimStateContext {
  text: string;
  surface: TruthClaimSurface;
  classCeiling?: TruthClaimClass;
}

export interface TruthClaimInspectionResult {
  findings: TruthClaimFinding[];
  violations: TruthClaimFinding[];
  boundedFindings: TruthClaimFinding[];
  warnings: SuspiciousTruthClaimFinding[];
}

export const NON_BLOCKING_TRUTH_CLAIM_CONTEXT_HINTS: readonly string[] = [
  "demonstration only",
  "sample data",
  "sample data for demonstration purposes",
  "example only",
  "not generated from",
  "not connected to your account",
  "does not constitute verified board evidence",
  "does not create a new governed record",
  "preview generated from available diagnostic evidence",
  "not independently verified",
  "requires evidence review",
  "no guaranteed outcomes",
  "do not guarantee",
  "forbidden",
  "prohibited",
];

export function evaluateTruthClaimFirewall(
  input: TruthClaimFirewallInput,
): TruthClaimFirewallDecision {
  const claim = getRequiredClaim(input.claimId);
  const blockers = new Set<string>();
  const classCeiling = input.classCeiling ?? DEFAULT_SURFACE_CLASS_CEILINGS[input.surface];

  if (claimClassExceedsCeiling(claim.claimClass, classCeiling)) {
    blockers.add(
      `Claim class ${claim.claimClass} exceeds surface ceiling ${classCeiling} for ${input.surface}.`,
    );
  }

  const requirements = claim.requirements;

  if (requirements.productClasses) {
    if (!input.productClass) {
      blockers.add("Missing product intelligence class.");
    } else if (!requirements.productClasses.includes(input.productClass)) {
      blockers.add(
        `Product class ${input.productClass} does not satisfy claim requirement. Expected one of: ${requirements.productClasses.join(", ")}.`,
      );
    }
  }

  if (requirements.requirePublicClaimAllowed && input.publicClaimAllowed !== true) {
    blockers.add("Public claim permission is not granted.");
  }

  if (requirements.evidenceStates) {
    if (!input.evidenceState) {
      blockers.add("Missing evidence state.");
    } else if (!requirements.evidenceStates.includes(input.evidenceState)) {
      blockers.add(
        `Evidence state ${input.evidenceState} does not satisfy claim requirement. Expected one of: ${requirements.evidenceStates.join(", ")}.`,
      );
    }
  }

  if (requirements.runStates) {
    if (!input.runState) {
      blockers.add("Missing run state.");
    } else if (!requirements.runStates.includes(input.runState)) {
      blockers.add(
        `Run state ${input.runState} does not satisfy claim requirement. Expected one of: ${requirements.runStates.join(", ")}.`,
      );
    }
  }

  if (requirements.harnessStates) {
    if (!input.harnessState) {
      blockers.add("Missing harness state.");
    } else if (!requirements.harnessStates.includes(input.harnessState)) {
      blockers.add(
        `Harness state ${input.harnessState} does not satisfy claim requirement. Expected one of: ${requirements.harnessStates.join(", ")}.`,
      );
    }
  }

  if (requirements.provenanceStates) {
    if (!input.provenanceState) {
      blockers.add("Missing provenance state.");
    } else if (!requirements.provenanceStates.includes(input.provenanceState)) {
      blockers.add(
        `Provenance state ${input.provenanceState} does not satisfy claim requirement. Expected one of: ${requirements.provenanceStates.join(", ")}.`,
      );
    }
  }

  if (requirements.outcomeStates) {
    if (!input.outcomeState) {
      blockers.add("Missing outcome state.");
    } else if (!requirements.outcomeStates.includes(input.outcomeState)) {
      blockers.add(
        `Outcome state ${input.outcomeState} does not satisfy claim requirement. Expected one of: ${requirements.outcomeStates.join(", ")}.`,
      );
    }
  }

  if (requirements.minimumJudgementScore !== undefined) {
    if (input.judgementScore === null || input.judgementScore === undefined) {
      blockers.add("Missing judgement score.");
    } else if (input.judgementScore < requirements.minimumJudgementScore) {
      blockers.add(
        `Judgement score ${input.judgementScore} is below the required minimum of ${requirements.minimumJudgementScore}.`,
      );
    }
  }

  if (requirements.minimumDeliveryScore !== undefined) {
    if (input.deliveryScore === null || input.deliveryScore === undefined) {
      blockers.add("Missing delivery score.");
    } else if (input.deliveryScore < requirements.minimumDeliveryScore) {
      blockers.add(
        `Delivery score ${input.deliveryScore} is below the required minimum of ${requirements.minimumDeliveryScore}.`,
      );
    }
  }

  if (requirements.requireRejectedAlternatives && input.namesRejectedAlternatives !== true) {
    blockers.add("Rejected alternatives are not explicitly present.");
  }

  if (requirements.requireWeakEvidenceHandling && input.weakEvidenceHandlingPassed !== true) {
    blockers.add("Weak-evidence handling has not been proven.");
  }

  if (requirements.requireBenchmarkRecord && input.benchmarkRecordPresent !== true) {
    blockers.add("Benchmark record is missing.");
  }

  return {
    claimId: claim.id,
    claimLabel: claim.label,
    claimClass: claim.claimClass,
    surface: input.surface,
    classCeiling,
    decision: blockers.size === 0 ? "allowed" : "blocked",
    blockers: [...blockers],
  };
}

export function isBoundedTruthClaimContext(
  context: string,
  surface?: TruthClaimSurface,
  fullText?: string,
): boolean {
  const normalized = context.toLowerCase();
  if (NON_BLOCKING_TRUTH_CLAIM_CONTEXT_HINTS.some((hint) => normalized.includes(hint))) {
    return true;
  }

  if (surface === "PUBLIC_SAMPLE_COPY" && fullText) {
    const fullTextLower = fullText.toLowerCase();
    return (
      fullTextLower.includes("demonstration only") ||
      fullTextLower.includes("sample data") ||
      fullTextLower.includes("not connected to your account") ||
      fullTextLower.includes("not generated from")
    );
  }

  return false;
}

export function scanTextForControlledClaims(
  input: Pick<TruthClaimInspectionInput, "text" | "surface">,
): ControlledClaimScanMatch[] {
  const lines = input.text.split(/\r?\n/);
  const matches: ControlledClaimScanMatch[] = [];

  for (const claim of CONTROLLED_TRUTH_CLAIMS) {
    pushRegexMatches({
      lines,
      patterns: claim.patterns,
      fullText: input.text,
      onMatch: ({ matchedText, line, column, context }) => {
        matches.push({
          claimId: claim.id,
          claimLabel: claim.label,
          claimClass: claim.claimClass,
          matchedText,
          surface: input.surface,
          line,
          column,
          context,
          boundedByContext: isBoundedTruthClaimContext(context, input.surface, input.text),
        });
      },
    });
  }

  return sortMatches(matches);
}

export function scanTextForSuspiciousClaims(
  input: Pick<TruthClaimInspectionInput, "text" | "surface">,
): SuspiciousClaimScanMatch[] {
  const lines = input.text.split(/\r?\n/);
  const matches: SuspiciousClaimScanMatch[] = [];

  for (const warning of SUSPICIOUS_TRUTH_CLAIM_WARNINGS) {
    pushRegexMatches({
      lines,
      patterns: warning.patterns,
      fullText: input.text,
      onMatch: ({ matchedText, line, column, context }) => {
        matches.push({
          label: warning.label,
          matchedText,
          surface: input.surface,
          line,
          column,
          context,
        });
      },
    });
  }

  return sortMatches(matches);
}

export function inspectTruthClaimsInText(
  input: TruthClaimInspectionInput,
): TruthClaimInspectionResult {
  const matches = scanTextForControlledClaims({
    text: input.text,
    surface: input.surface,
  });

  const findings = matches.map<TruthClaimFinding>((match) => {
    if (match.boundedByContext) {
      return {
        ...match,
        decision: "bounded",
        blockers: [],
      };
    }

    const decision = evaluateTruthClaimFirewall({
      claimId: match.claimId,
      surface: input.surface,
      classCeiling: input.classCeiling,
      productClass: input.productClass,
      publicClaimAllowed: input.publicClaimAllowed,
      evidenceState: input.evidenceState,
      runState: input.runState,
      harnessState: input.harnessState,
      provenanceState: input.provenanceState,
      outcomeState: input.outcomeState,
      judgementScore: input.judgementScore,
      deliveryScore: input.deliveryScore,
      namesRejectedAlternatives: input.namesRejectedAlternatives,
      weakEvidenceHandlingPassed: input.weakEvidenceHandlingPassed,
      benchmarkRecordPresent: input.benchmarkRecordPresent,
    });

    return {
      ...match,
      decision: decision.decision,
      blockers: decision.blockers,
    };
  });

  const warnings = scanTextForSuspiciousClaims({
    text: input.text,
    surface: input.surface,
  }).map<SuspiciousTruthClaimFinding>((warning) => ({
    ...warning,
    note: getWarningNote(warning.label),
  }));

  return {
    findings,
    violations: findings.filter((finding) => finding.decision === "blocked"),
    boundedFindings: findings.filter((finding) => finding.decision === "bounded"),
    warnings,
  };
}

export function inspectTruthClaimsInFile(
  input: Omit<TruthClaimInspectionInput, "text"> & { filePath: string },
): TruthClaimInspectionResult {
  const text = readFileSync(input.filePath, "utf8");
  const result = inspectTruthClaimsInText({
    text,
    surface: input.surface,
    classCeiling: input.classCeiling,
    productClass: input.productClass,
    publicClaimAllowed: input.publicClaimAllowed,
    evidenceState: input.evidenceState,
    runState: input.runState,
    harnessState: input.harnessState,
    provenanceState: input.provenanceState,
    outcomeState: input.outcomeState,
    judgementScore: input.judgementScore,
    deliveryScore: input.deliveryScore,
    namesRejectedAlternatives: input.namesRejectedAlternatives,
    weakEvidenceHandlingPassed: input.weakEvidenceHandlingPassed,
    benchmarkRecordPresent: input.benchmarkRecordPresent,
  });

  return {
    findings: result.findings.map((finding) => ({ ...finding, source: input.filePath })),
    violations: result.violations.map((finding) => ({ ...finding, source: input.filePath })),
    boundedFindings: result.boundedFindings.map((finding) => ({
      ...finding,
      source: input.filePath,
    })),
    warnings: result.warnings.map((warning) => ({ ...warning, source: input.filePath })),
  };
}

function getRequiredClaim(claimId: ControlledClaimId): ControlledClaimDefinition {
  const claim = getControlledTruthClaim(claimId);
  if (!claim) {
    throw new Error(`Unknown controlled claim: ${claimId}`);
  }
  return claim;
}

function getWarningNote(label: string): string {
  const warning = SUSPICIOUS_TRUTH_CLAIM_WARNINGS.find((entry) => entry.label === label);
  return warning?.note ?? "Suspicious language requires review.";
}

function buildGlobalRegex(pattern: RegExp): RegExp {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  return new RegExp(pattern.source, flags);
}

function pushRegexMatches(input: {
  lines: string[];
  patterns: readonly RegExp[];
  fullText: string;
  onMatch: (args: {
    matchedText: string;
    line: number;
    column: number;
    context: string;
  }) => void;
}): void {
  for (const pattern of input.patterns) {
    for (let index = 0; index < input.lines.length; index += 1) {
      const line = input.lines[index] ?? "";
      const regex = buildGlobalRegex(pattern);
      let result: RegExpExecArray | null;

      while ((result = regex.exec(line)) !== null) {
        const matchedText = result[0];
        if (matchedText.length === 0) {
          regex.lastIndex += 1;
          continue;
        }

        const column = result.index + 1;
        const contextWindow = input.lines
          .slice(Math.max(0, index - 2), Math.min(input.lines.length, index + 3))
          .join(" ");

        input.onMatch({
          matchedText,
          line: index + 1,
          column,
          context: contextWindow.trim().slice(0, 320),
        });
      }
    }
  }
}

function sortMatches<T extends { line: number; column: number }>(matches: T[]): T[] {
  return matches.sort((left, right) => {
    if (left.line !== right.line) {
      return left.line - right.line;
    }
    return left.column - right.column;
  });
}
