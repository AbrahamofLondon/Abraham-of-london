import { readFileSync } from "node:fs";

import type { DerivedEvidenceState } from "@/lib/product/derived-evidence-state";
import type { ProductAuthorityState } from "@/lib/product/product-authority-contract";

import {
  claimClassExceedsCeiling,
  CONTROLLED_TRUTH_CLAIMS,
  DEFAULT_SURFACE_CLASS_CEILINGS,
  getControlledTruthClaim,
  type ControlledClaimDefinition,
  type ControlledClaimId,
  type TruthClaimClass,
  type TruthClaimHarnessState,
  type TruthClaimOutcomeState,
  type TruthClaimProvenanceState,
  type TruthClaimRunState,
  type TruthClaimSurface,
} from "./claim-vocabulary-registry";

export interface TruthClaimStateContext {
  authorityState?: ProductAuthorityState | null;
  publicClaimAllowed?: boolean | null;
  evidenceState?: Pick<
    DerivedEvidenceState,
    "ledgerEntryExists" | "ledgerStatus" | "hasValidV2Evidence" | "canSupportAuthorityReview"
  > | null;
  runState?: TruthClaimRunState | null;
  harnessState?: TruthClaimHarnessState | null;
  provenanceState?: TruthClaimProvenanceState | null;
  outcomeState?: TruthClaimOutcomeState | null;
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

export interface TruthClaimFinding extends ControlledClaimScanMatch {
  source?: string;
  decision: "allowed" | "blocked" | "bounded";
  blockers: string[];
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
}

export const NON_BLOCKING_TRUTH_CLAIM_CONTEXT_HINTS: readonly string[] = [
  "demonstration only",
  "sample data",
  "example only",
  "not generated from",
  "not connected to your account",
  "does not constitute verified board evidence",
  "not independently verified",
  "requires evidence review",
  "no guaranteed outcomes",
  "not guaranteed outcome",
  "not guaranteed outcomes",
  "do not guarantee",
  "forbidden",
  "prohibited",
];

export function evaluateTruthClaimFirewall(
  input: TruthClaimFirewallInput
): TruthClaimFirewallDecision {
  const claim = getRequiredClaim(input.claimId);
  const blockers = new Set<string>();
  const classCeiling = input.classCeiling ?? DEFAULT_SURFACE_CLASS_CEILINGS[input.surface];

  if (claimClassExceedsCeiling(claim.claimClass, classCeiling)) {
    blockers.add(
      `Claim class ${claim.claimClass} exceeds surface ceiling ${classCeiling} for ${input.surface}.`
    );
  }

  if (claim.prohibited) {
    blockers.add("Claim language is prohibited on public or product-facing copy.");
  }

  const requirements = claim.requirements;

  if (requirements.authorityStates) {
    if (!input.authorityState) {
      blockers.add("Missing authority state.");
    } else if (!requirements.authorityStates.includes(input.authorityState)) {
      blockers.add(
        `Authority state ${input.authorityState} does not satisfy claim requirement. Expected one of: ${requirements.authorityStates.join(", ")}.`
      );
    }
  }

  if (requirements.requirePublicClaimAllowed && input.publicClaimAllowed !== true) {
    blockers.add("Public claim permission is not granted.");
  }

  if (
    requirements.evidenceStatuses ||
    requirements.requireLedgerEntry ||
    requirements.requireValidEvidence
  ) {
    if (!input.evidenceState) {
      blockers.add("Missing evidence state.");
    } else {
      if (requirements.requireLedgerEntry && input.evidenceState.ledgerEntryExists !== true) {
        blockers.add("Evidence ledger entry is missing.");
      }

      if (requirements.requireValidEvidence && input.evidenceState.hasValidV2Evidence !== true) {
        blockers.add("Evidence state is not v2-valid.");
      }

      if (
        requirements.evidenceStatuses &&
        !requirements.evidenceStatuses.includes(input.evidenceState.ledgerStatus)
      ) {
        blockers.add(
          `Evidence status ${input.evidenceState.ledgerStatus} does not satisfy claim requirement. Expected one of: ${requirements.evidenceStatuses.join(", ")}.`
        );
      }
    }
  }

  if (requirements.runStates) {
    if (!input.runState) {
      blockers.add("Missing run state.");
    } else if (!requirements.runStates.includes(input.runState)) {
      blockers.add(
        `Run state ${input.runState} does not satisfy claim requirement. Expected one of: ${requirements.runStates.join(", ")}.`
      );
    }
  }

  if (requirements.harnessStates) {
    if (!input.harnessState) {
      blockers.add("Missing harness state.");
    } else if (!requirements.harnessStates.includes(input.harnessState)) {
      blockers.add(
        `Harness state ${input.harnessState} does not satisfy claim requirement. Expected one of: ${requirements.harnessStates.join(", ")}.`
      );
    }
  }

  if (requirements.provenanceStates) {
    if (!input.provenanceState) {
      blockers.add("Missing provenance state.");
    } else if (!requirements.provenanceStates.includes(input.provenanceState)) {
      blockers.add(
        `Provenance state ${input.provenanceState} does not satisfy claim requirement. Expected one of: ${requirements.provenanceStates.join(", ")}.`
      );
    }
  }

  if (requirements.outcomeStates) {
    if (!input.outcomeState) {
      blockers.add("Missing outcome state.");
    } else if (!requirements.outcomeStates.includes(input.outcomeState)) {
      blockers.add(
        `Outcome state ${input.outcomeState} does not satisfy claim requirement. Expected one of: ${requirements.outcomeStates.join(", ")}.`
      );
    }
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
  fullText?: string
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
  input: Pick<TruthClaimInspectionInput, "text" | "surface">
): ControlledClaimScanMatch[] {
  const lines = input.text.split(/\r?\n/);
  const matches: ControlledClaimScanMatch[] = [];

  for (const claim of CONTROLLED_TRUTH_CLAIMS) {
    for (const pattern of claim.patterns) {
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index] ?? "";
        const regex = buildGlobalRegex(pattern);
        let result: RegExpExecArray | null;

        while ((result = regex.exec(line)) !== null) {
          const matchedText = result[0];
          if (matchedText.length === 0) {
            regex.lastIndex += 1;
            continue;
          }

          const column = result.index + 1;
          const contextWindow = lines
            .slice(Math.max(0, index - 2), Math.min(lines.length, index + 3))
            .join(" ");

          matches.push({
            claimId: claim.id,
            claimLabel: claim.label,
            claimClass: claim.claimClass,
            matchedText,
            surface: input.surface,
            line: index + 1,
            column,
            context: line.trim().slice(0, 240),
            boundedByContext: isBoundedTruthClaimContext(
              contextWindow,
              input.surface,
              input.text
            ),
          });
        }
      }
    }
  }

  return matches.sort((left, right) => {
    if (left.line !== right.line) return left.line - right.line;
    return left.column - right.column;
  });
}

export function inspectTruthClaimsInText(
  input: TruthClaimInspectionInput
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
      authorityState: input.authorityState,
      publicClaimAllowed: input.publicClaimAllowed,
      evidenceState: input.evidenceState,
      runState: input.runState,
      harnessState: input.harnessState,
      provenanceState: input.provenanceState,
      outcomeState: input.outcomeState,
    });

    return {
      ...match,
      decision: decision.decision,
      blockers: decision.blockers,
    };
  });

  return {
    findings,
    violations: findings.filter((finding) => finding.decision === "blocked"),
    boundedFindings: findings.filter((finding) => finding.decision === "bounded"),
  };
}

export function inspectTruthClaimsInFile(
  input: Omit<TruthClaimInspectionInput, "text"> & { filePath: string }
): TruthClaimInspectionResult {
  const text = readFileSync(input.filePath, "utf8");
  const result = inspectTruthClaimsInText({
    text,
    surface: input.surface,
    classCeiling: input.classCeiling,
    authorityState: input.authorityState,
    publicClaimAllowed: input.publicClaimAllowed,
    evidenceState: input.evidenceState,
    runState: input.runState,
    harnessState: input.harnessState,
    provenanceState: input.provenanceState,
    outcomeState: input.outcomeState,
  });

  return {
    findings: result.findings.map((finding) => ({
      ...finding,
      source: input.filePath,
    })),
    violations: result.violations.map((finding) => ({
      ...finding,
      source: input.filePath,
    })),
    boundedFindings: result.boundedFindings.map((finding) => ({
      ...finding,
      source: input.filePath,
    })),
  };
}

function getRequiredClaim(claimId: ControlledClaimId): ControlledClaimDefinition {
  const claim = getControlledTruthClaim(claimId);
  if (!claim) {
    throw new Error(`Unknown controlled claim: ${claimId}`);
  }
  return claim;
}

function buildGlobalRegex(pattern: RegExp): RegExp {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  return new RegExp(pattern.source, flags);
}
